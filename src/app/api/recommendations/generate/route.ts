import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getEventLogs } from '@/lib/events/logger'

const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

// POST /api/recommendations/generate - Generate recommendations from event logs
export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)

    // 1. 分析: 毎回追加されるチェック項目を探す
    const { data: checklistCreatedLogs } = await supabase
      .from('event_logs')
      .select('payload_json, task_id, created_at')
      .eq('event_type', 'checklist_created')
      .gte('created_at', fourWeeksAgo.toISOString())
      .order('created_at', { ascending: false })

    // チェック項目のテキストを集計
    const checklistTextCounts = new Map<string, { count: number; taskIds: string[]; lastSeen: Date }>()
    
    if (checklistCreatedLogs) {
      for (const log of checklistCreatedLogs) {
        const text = log.payload_json?.text_ja
        if (text) {
          const existing = checklistTextCounts.get(text) || { count: 0, taskIds: [], lastSeen: new Date(0) }
          existing.count++
          if (log.task_id && !existing.taskIds.includes(log.task_id)) {
            existing.taskIds.push(log.task_id)
          }
          const logDate = new Date(log.created_at)
          if (logDate > existing.lastSeen) {
            existing.lastSeen = logDate
          }
          checklistTextCounts.set(text, existing)
        }
      }
    }

    // 3回以上追加されたチェック項目を提案候補に
    const frequentChecklistItems: Array<{ text: string; count: number }> = []
    for (const [text, data] of checklistTextCounts.entries()) {
      if (data.count >= 3) {
        frequentChecklistItems.push({ text, count: data.count })
      }
    }

    // 2. 分析: いつも遅れる投稿タスクを探す
    const { data: overduePromotionTasks } = await supabase
      .from('tasks')
      .select('id, title_ja, due_at, tag, week_id')
      .eq('tag', 'Promotion')
      .lt('due_at', now.toISOString())
      .in('status', ['TODO', 'IN_PROGRESS'])
      .gte('created_at', fourWeeksAgo.toISOString())

    // 同じタイトルのタスクが複数回遅れているかチェック
    const overdueTaskTitles = new Map<string, { count: number; totalDelay: number }>()
    if (overduePromotionTasks) {
      for (const task of overduePromotionTasks) {
        const delayHours = (now.getTime() - new Date(task.due_at).getTime()) / (1000 * 60 * 60)
        const existing = overdueTaskTitles.get(task.title_ja) || { count: 0, totalDelay: 0 }
        existing.count++
        existing.totalDelay += delayHours
        overdueTaskTitles.set(task.title_ja, existing)
      }
    }

    // 2回以上遅れているタスクを提案候補に
    const frequentlyOverdueTasks: Array<{ title: string; count: number; avgDelayHours: number }> = []
    for (const [title, data] of overdueTaskTitles.entries()) {
      if (data.count >= 2) {
        const avgDelayHours = data.totalDelay / data.count
        frequentlyOverdueTasks.push({ title, count: data.count, avgDelayHours: Math.round(avgDelayHours) })
      }
    }

    // 3. 分析: マキシムに割り当てた方が早い作業候補
    const { data: maximeUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'worker')
      .single()

    let maximeEfficiencyRecommendations: Array<{ text: string; taskTitle: string }> = []
    if (maximeUser) {
      // マキシムが担当したチェック項目の完了時間を分析
      const { data: maximeCompletedItems } = await supabase
        .from('checklist_items')
        .select('id, text_ja, task_id, done_at, due_at, tasks!inner(title_ja)')
        .eq('assignee_user_id', maximeUser.id)
        .eq('is_done', true)
        .not('done_at', 'is', null)
        .gte('created_at', fourWeeksAgo.toISOString())

      // 他の人が担当した同じチェック項目と比較
      if (maximeCompletedItems) {
        for (const item of maximeCompletedItems) {
          const { data: otherItems } = await supabase
            .from('checklist_items')
            .select('id, done_at, due_at, assignee_user_id')
            .eq('text_ja', item.text_ja)
            .neq('assignee_user_id', maximeUser.id)
            .eq('is_done', true)
            .gte('created_at', fourWeeksAgo.toISOString())

          if (otherItems && otherItems.length > 0) {
            // マキシムの方が早く完了している場合
            const maximeDelay = item.done_at && item.due_at 
              ? (new Date(item.done_at).getTime() - new Date(item.due_at).getTime()) / (1000 * 60 * 60)
              : 0
            
            const otherAvgDelay = otherItems
              .filter(i => i.done_at && i.due_at)
              .map(i => (new Date(i.done_at!).getTime() - new Date(i.due_at!).getTime()) / (1000 * 60 * 60))
              .reduce((a, b) => a + b, 0) / otherItems.length

            if (maximeDelay < otherAvgDelay - 2) { // 2時間以上早い
              // tasksは配列として返される可能性があるため、最初の要素を取得
              const taskTitle = Array.isArray(item.tasks) 
                ? (item.tasks[0]?.title_ja || '')
                : (item.tasks as any)?.title_ja || ''
              
              maximeEfficiencyRecommendations.push({
                text: item.text_ja,
                taskTitle,
              })
            }
          }
        }
      }
    }

    // 4. Gemini APIで提案を生成
    const recommendations: Array<{
      type: string
      payload_json: Record<string, any>
      status: 'proposed'
    }> = []

    if (genAI && (frequentChecklistItems.length > 0 || frequentlyOverdueTasks.length > 0 || maximeEfficiencyRecommendations.length > 0)) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

        let prompt = `以下の分析結果から、タスク運用の改善提案を生成してください。各提案は簡潔で実行可能なものにしてください。

`

        if (frequentChecklistItems.length > 0) {
          prompt += `【頻繁に追加されるチェック項目】
${frequentChecklistItems.map(item => `- "${item.text}" (${item.count}回追加)`).join('\n')}

これらのチェック項目はテンプレートに追加すべきです。
`
        }

        if (frequentlyOverdueTasks.length > 0) {
          prompt += `【頻繁に遅れる投稿タスク】
${frequentlyOverdueTasks.map(task => `- "${task.title}" (${task.count}回遅れ、平均${task.avgDelayHours}時間遅延)`).join('\n')}

これらのタスクの期限を前倒しすべきです。
`
        }

        if (maximeEfficiencyRecommendations.length > 0) {
          prompt += `【マキシムに割り当てた方が効率的な作業】
${maximeEfficiencyRecommendations.map(rec => `- "${rec.text}" (タスク: ${rec.taskTitle})`).join('\n')}

これらの作業はマキシムに割り当てることを検討すべきです。
`
        }

        prompt += `
各提案について、以下のJSON形式で出力してください：
{
  "type": "add_checklist_to_template" | "adjust_task_deadline" | "assign_to_maxime",
  "title": "提案のタイトル",
  "description": "提案の詳細説明",
  "action": "具体的なアクション内容"
}

複数の提案がある場合は、配列形式で出力してください。`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // JSONを抽出（```json で囲まれている可能性がある）
        const jsonMatch = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          const proposals = Array.isArray(parsed) ? parsed : [parsed]

          for (const proposal of proposals) {
            recommendations.push({
              type: proposal.type || 'general',
              payload_json: {
                title: proposal.title,
                description: proposal.description,
                action: proposal.action,
                ...(proposal.type === 'add_checklist_to_template' && frequentChecklistItems.length > 0
                  ? { checklist_text: frequentChecklistItems[0].text, count: frequentChecklistItems[0].count }
                  : {}),
                ...(proposal.type === 'adjust_task_deadline' && frequentlyOverdueTasks.length > 0
                  ? { task_title: frequentlyOverdueTasks[0].title, avg_delay_hours: frequentlyOverdueTasks[0].avgDelayHours }
                  : {}),
                ...(proposal.type === 'assign_to_maxime' && maximeEfficiencyRecommendations.length > 0
                  ? { checklist_text: maximeEfficiencyRecommendations[0].text, task_title: maximeEfficiencyRecommendations[0].taskTitle }
                  : {}),
              },
              status: 'proposed',
            })
          }
        }
      } catch (error) {
        console.error('Error generating recommendations with Gemini:', error)
        // Gemini失敗時はルールベースの提案を生成
        if (frequentChecklistItems.length > 0) {
          recommendations.push({
            type: 'add_checklist_to_template',
            payload_json: {
              title: 'テンプレートにチェック項目を追加',
              description: `「${frequentChecklistItems[0].text}」が${frequentChecklistItems[0].count}回追加されています。テンプレートに追加することをお勧めします。`,
              action: `テンプレートに「${frequentChecklistItems[0].text}」を追加`,
              checklist_text: frequentChecklistItems[0].text,
              count: frequentChecklistItems[0].count,
            },
            status: 'proposed',
          })
        }

        if (frequentlyOverdueTasks.length > 0) {
          recommendations.push({
            type: 'adjust_task_deadline',
            payload_json: {
              title: 'タスクの期限を前倒し',
              description: `「${frequentlyOverdueTasks[0].title}」が${frequentlyOverdueTasks[0].count}回遅れています（平均${frequentlyOverdueTasks[0].avgDelayHours}時間遅延）。期限を前倒しすることをお勧めします。`,
              action: `「${frequentlyOverdueTasks[0].title}」の期限を${frequentlyOverdueTasks[0].avgDelayHours}時間前倒し`,
              task_title: frequentlyOverdueTasks[0].title,
              avg_delay_hours: frequentlyOverdueTasks[0].avgDelayHours,
            },
            status: 'proposed',
          })
        }
      }
    } else {
      // Gemini APIがない場合のルールベース提案
      if (frequentChecklistItems.length > 0) {
        recommendations.push({
          type: 'add_checklist_to_template',
          payload_json: {
            title: 'テンプレートにチェック項目を追加',
            description: `「${frequentChecklistItems[0].text}」が${frequentChecklistItems[0].count}回追加されています。`,
            action: `テンプレートに「${frequentChecklistItems[0].text}」を追加`,
            checklist_text: frequentChecklistItems[0].text,
            count: frequentChecklistItems[0].count,
          },
          status: 'proposed',
        })
      }

      if (frequentlyOverdueTasks.length > 0) {
        recommendations.push({
          type: 'adjust_task_deadline',
          payload_json: {
            title: 'タスクの期限を前倒し',
            description: `「${frequentlyOverdueTasks[0].title}」が${frequentlyOverdueTasks[0].count}回遅れています。`,
            action: `「${frequentlyOverdueTasks[0].title}」の期限を前倒し`,
            task_title: frequentlyOverdueTasks[0].title,
            avg_delay_hours: frequentlyOverdueTasks[0].avgDelayHours,
          },
          status: 'proposed',
        })
      }
    }

    // 既存の提案と重複チェック
    const { data: existingRecommendations } = await supabase
      .from('recommendations')
      .select('payload_json, status')
      .eq('status', 'proposed')

    const newRecommendations = recommendations.filter(rec => {
      if (!existingRecommendations) return true
      return !existingRecommendations.some(existing => {
        const existingPayload = existing.payload_json as any
        const newPayload = rec.payload_json
        return existingPayload?.title === newPayload?.title && existingPayload?.action === newPayload?.action
      })
    })

    // 新しい提案を保存
    if (newRecommendations.length > 0) {
      const { error: insertError } = await supabase
        .from('recommendations')
        .insert(newRecommendations)

      if (insertError) {
        console.error('Error inserting recommendations:', insertError)
      }
    }

    return NextResponse.json({
      generated: newRecommendations.length,
      recommendations: newRecommendations,
    })
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
