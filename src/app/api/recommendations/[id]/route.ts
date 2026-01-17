import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// PATCH /api/recommendations/[id] - Approve or reject a recommendation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, decided_by } = body // status: 'approved' | 'rejected'

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get recommendation
    const { data: recommendation, error: fetchError } = await supabase
      .from('recommendations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }

    // Update recommendation status
    const { data: updatedRecommendation, error: updateError } = await supabase
      .from('recommendations')
      .update({
        status,
        decided_by: decided_by || null,
        decided_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // If approved, apply the recommendation
    if (status === 'approved') {
      await applyRecommendation(recommendation)
    }

    return NextResponse.json({ recommendation: updatedRecommendation })
  } catch (error) {
    console.error('Error updating recommendation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

interface RecommendationPayload {
  checklist_text?: string
  task_title?: string
  avg_delay_hours?: number
}

interface RecommendationRecord {
  type: string
  payload_json: RecommendationPayload
}

async function applyRecommendation(recommendation: RecommendationRecord) {
  const { type, payload_json } = recommendation

  try {
    if (type === 'add_checklist_to_template') {
      // テンプレートにチェック項目を追加
      const { data: activeTemplate } = await supabase
        .from('templates')
        .select('id')
        .eq('is_active', true)
        .single()

      if (activeTemplate && payload_json.checklist_text) {
        // 適切なテンプレートタスクを見つける（投稿タスクなど）
        const { data: templateTasks } = await supabase
          .from('template_tasks')
          .select('id')
          .eq('template_id', activeTemplate.id)
          .eq('tag', 'Promotion')
          .limit(1)

        if (templateTasks && templateTasks.length > 0) {
          // 既存のチェック項目を確認
          const { data: existingItems } = await supabase
            .from('template_checklist_items')
            .select('id')
            .eq('template_task_id', templateTasks[0].id)
            .eq('text_ja', payload_json.checklist_text)

          if (!existingItems || existingItems.length === 0) {
            // 新しいチェック項目を追加
            const { data: allItems } = await supabase
              .from('template_checklist_items')
              .select('sort_order')
              .eq('template_task_id', templateTasks[0].id)
              .order('sort_order', { ascending: false })
              .limit(1)

            const nextSortOrder = allItems && allItems.length > 0 ? (allItems[0].sort_order || 0) + 1 : 0

            await supabase.from('template_checklist_items').insert({
              template_task_id: templateTasks[0].id,
              text_ja: payload_json.checklist_text,
              default_assignee_role_or_user: 'role:coadmin', // デフォルト
              sort_order: nextSortOrder,
            })
          }
        }
      }
    } else if (type === 'adjust_task_deadline') {
      // タスクの期限を前倒し
      const { data: activeTemplate } = await supabase
        .from('templates')
        .select('id')
        .eq('is_active', true)
        .single()

      if (activeTemplate && payload_json.task_title && payload_json.avg_delay_hours) {
        const { data: templateTasks } = await supabase
          .from('template_tasks')
          .select('id, relative_due_rule')
          .eq('template_id', activeTemplate.id)
          .eq('title_ja', payload_json.task_title)
          .limit(1)

        if (templateTasks && templateTasks.length > 0) {
          const currentRule = templateTasks[0].relative_due_rule
          // 期限ルールを解析して前倒し
          const match = currentRule.match(/^([+-]?\d+)\s*(day|days)\s+(\d{1,2}):(\d{2})$/)
          if (match) {
            const [, daysStr, , hoursStr, minutesStr] = match
            const days = parseInt(daysStr, 10)
            const hours = parseInt(hoursStr, 10)
            const minutes = parseInt(minutesStr, 10)

            // 平均遅延時間の分だけ前倒し（時間単位で切り上げ）
            const hoursToAdvance = Math.ceil(payload_json.avg_delay_hours / 24) * 24 // 日単位で前倒し
            const newDays = days - Math.floor(hoursToAdvance / 24)

            const newRule = `${newDays} days ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

            await supabase
              .from('template_tasks')
              .update({ relative_due_rule: newRule })
              .eq('id', templateTasks[0].id)
          }
        }
      }
    } else if (type === 'assign_to_maxime') {
      // マキシムに割り当てる提案（テンプレートのデフォルト担当者を変更）
      const { data: maximeUser } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'worker')
        .single()

      if (maximeUser && payload_json.checklist_text) {
        const { data: activeTemplate } = await supabase
          .from('templates')
          .select('id')
          .eq('is_active', true)
          .single()

        if (activeTemplate) {
          const { data: templateTasks } = await supabase
            .from('template_tasks')
            .select('id')
            .eq('template_id', activeTemplate.id)
            .eq('title_ja', payload_json.task_title || '')
            .limit(1)

          if (templateTasks && templateTasks.length > 0) {
            const { data: checklistItems } = await supabase
              .from('template_checklist_items')
              .select('id')
              .eq('template_task_id', templateTasks[0].id)
              .eq('text_ja', payload_json.checklist_text)
              .limit(1)

            if (checklistItems && checklistItems.length > 0) {
              await supabase
                .from('template_checklist_items')
                .update({ default_assignee_role_or_user: maximeUser.id })
                .eq('id', checklistItems[0].id)
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error applying recommendation:', error)
    // エラーが発生しても提案の承認状態は更新されているので、エラーをログに記録するだけ
  }
}
