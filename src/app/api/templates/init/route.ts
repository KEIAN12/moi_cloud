import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// POST /api/templates/init - Initialize default template
export async function POST() {
  try {
    // Check if template already exists
    const { data: existing } = await supabase
      .from('templates')
      .select('id')
      .eq('is_active', true)
      .single()

    if (existing) {
      return NextResponse.json({ message: 'Template already exists', template_id: existing.id })
    }

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .insert({
        name: '週1営業テンプレート（木曜基準）',
        is_active: true,
        version: 1,
      })
      .select()
      .single()

    if (templateError) {
      return NextResponse.json({ error: templateError.message }, { status: 500 })
    }

    // Create template tasks (based on requirements)
    const templateTasks = [
      {
        title_ja: '投稿: 営業告知',
        body_ja: '次回営業日の告知を投稿',
        relative_due_rule: '-7 days 18:00',
        tag: 'Promotion',
        sort_order: 1,
        checklist_items: [
          { text_ja: '文面作成', default_assignee: 'role:coadmin' },
          { text_ja: '日時確認', default_assignee: 'role:admin' },
          { text_ja: '投稿実行', default_assignee: 'role:coadmin' },
        ],
      },
      {
        title_ja: '投稿: 取り置き案内',
        body_ja: '取り置き案内を投稿（公式LINE誘導、DM不可、営業日当日不可、先着、受付完了返信が完了条件）',
        relative_due_rule: '-4 days 20:00',
        tag: 'Promotion',
        sort_order: 2,
        checklist_items: [
          { text_ja: '取り置きルール確認', default_assignee: 'role:admin' },
          { text_ja: '投稿実行', default_assignee: 'role:coadmin' },
        ],
      },
      {
        title_ja: '取り置き運用と集計',
        body_ja: '取り置き受付の処理と集計',
        relative_due_rule: '-3 days 10:00',
        tag: 'Reservation',
        sort_order: 3,
        checklist_items: [
          { text_ja: '受付処理（随時）', default_assignee: 'role:coadmin' },
          { text_ja: '受付完了返信を送る', default_assignee: 'role:coadmin' },
          { text_ja: '集計を更新する', default_assignee: 'role:admin' },
          { text_ja: '予定数到達なら受付終了を投稿', default_assignee: 'role:coadmin' },
        ],
      },
      {
        title_ja: '製造計画',
        body_ja: '合計数と内訳を決定',
        relative_due_rule: '-1 days 21:00',
        tag: 'Planning',
        sort_order: 4,
        checklist_items: [
          { text_ja: '合計数決定', default_assignee: 'role:admin' },
          { text_ja: '内訳決定', default_assignee: 'role:admin' },
          { text_ja: '仕込み割り振り', default_assignee: 'role:admin' },
        ],
      },
      {
        title_ja: '仕込み',
        body_ja: '生地や材料の準備',
        relative_due_rule: '0 days 09:00',
        tag: 'Prep',
        sort_order: 5,
        checklist_items: [
          { text_ja: '工程チェック項目（詳細は後日入力）', default_assignee: 'role:worker' },
        ],
      },
      {
        title_ja: '焼き',
        body_ja: 'パンを焼く作業',
        relative_due_rule: '0 days 10:30',
        tag: 'Prep',
        sort_order: 6,
        checklist_items: [
          { text_ja: '工程チェック項目（詳細は後日入力）', default_assignee: 'role:worker' },
        ],
      },
      {
        title_ja: '開店準備',
        body_ja: '開店前の準備作業',
        relative_due_rule: '0 days 13:00',
        tag: 'Opening',
        sort_order: 7,
        checklist_items: [
          { text_ja: '駐車場札を立てる', default_assignee: 'role:worker' },
          { text_ja: '駐車場ブロック移動', default_assignee: 'role:worker' },
          { text_ja: 'レジ準備', default_assignee: 'role:coadmin' },
          { text_ja: '釣銭確認', default_assignee: 'role:admin' },
          { text_ja: '表示物確認', default_assignee: 'role:coadmin' },
        ],
      },
      {
        title_ja: '閉店作業',
        body_ja: '閉店後の片付けと締め',
        relative_due_rule: '0 days 17:00',
        tag: 'Closing',
        sort_order: 8,
        checklist_items: [
          { text_ja: '片付け', default_assignee: 'role:worker' },
          { text_ja: '清掃', default_assignee: 'role:worker' },
          { text_ja: '締め', default_assignee: 'role:admin' },
        ],
      },
    ]

    // Get users to resolve role-based assignees
    const { data: users } = await supabase.from('users').select('id, role')

    const createdTasks: any[] = []

    for (const taskData of templateTasks) {
      const { data: templateTask, error: taskError } = await supabase
        .from('template_tasks')
        .insert({
          template_id: template.id,
          title_ja: taskData.title_ja,
          body_ja: taskData.body_ja,
          relative_due_rule: taskData.relative_due_rule,
          tag: taskData.tag,
          sort_order: taskData.sort_order,
        })
        .select()
        .single()

      if (taskError) {
        console.error('Error creating template task:', taskError)
        continue
      }

      // Create checklist items
      for (const itemData of taskData.checklist_items) {
        let assigneeId: string | null = null

        if (itemData.default_assignee.startsWith('role:')) {
          const role = itemData.default_assignee.replace('role:', '')
          const user = users?.find((u) => u.role === role)
          assigneeId = user?.id || null
        } else {
          assigneeId = itemData.default_assignee
        }

        if (!assigneeId) {
          continue
        }

        await supabase.from('template_checklist_items').insert({
          template_task_id: templateTask.id,
          text_ja: itemData.text_ja,
          default_assignee_role_or_user: itemData.default_assignee,
          sort_order: taskData.checklist_items.indexOf(itemData),
        })
      }

      createdTasks.push(templateTask)
    }

    return NextResponse.json({
      template_id: template.id,
      tasks_created: createdTasks.length,
    })
  } catch (error) {
    console.error('Error initializing template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
