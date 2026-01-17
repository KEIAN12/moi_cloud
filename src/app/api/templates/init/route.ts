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

    // Create template tasks (based on actual workflow from store manager)
    const templateTasks = [
      // フェーズ1: 営業日決定・告知（営業日-7日〜-4日）
      {
        title_ja: '営業日決定',
        body_ja: '次回の営業日を決定する',
        relative_due_rule: '-7 days 18:00',
        tag: 'Planning',
        sort_order: 1,
        checklist_items: [
          { text_ja: '営業日を決める', default_assignee: 'role:admin' },
        ],
      },
      {
        title_ja: 'ラインナップ決定',
        body_ja: '次回のラインナップを決める（営業日の翌日）',
        relative_due_rule: '+1 days 18:00',
        tag: 'Planning',
        sort_order: 2,
        checklist_items: [
          { text_ja: '営業日の翌日に次回のラインナップを決める', default_assignee: 'role:admin' },
        ],
      },
      {
        title_ja: 'Instagram投稿: 営業日とラインナップ案内',
        body_ja: 'Instagramに営業日とラインナップの案内を投稿',
        relative_due_rule: '-6 days 18:00',
        tag: 'Promotion',
        sort_order: 3,
        checklist_items: [
          { text_ja: 'Instagramに営業日とラインナップの案内を投稿', default_assignee: 'role:admin' },
        ],
      },
      {
        title_ja: '公式LINE: お取り置き案内配信',
        body_ja: '公式LINEでお取り置きの案内を配信',
        relative_due_rule: '-4 days 20:00',
        tag: 'Promotion',
        sort_order: 4,
        checklist_items: [
          { text_ja: '公式LINEでお取り置きの案内を配信', default_assignee: 'role:admin' },
        ],
      },
      // フェーズ2: 取り置き管理（営業日-4日〜-1日）
      {
        title_ja: '取り置き対応',
        body_ja: 'お取り置きの申込者への返信と集計',
        relative_due_rule: '-4 days 10:00',
        tag: 'Reservation',
        sort_order: 5,
        checklist_items: [
          { text_ja: 'お取り置きの申込者に返信', default_assignee: 'role:admin' },
          { text_ja: 'お取り置きの集計をスプレッドシートに入力', default_assignee: 'role:admin' },
        ],
      },
      {
        title_ja: '製造数量決定',
        body_ja: 'お取り置きの数を踏まえ、作る数を検討し、味ごとに決める',
        relative_due_rule: '-2 days 18:00',
        tag: 'Planning',
        sort_order: 6,
        checklist_items: [
          { text_ja: 'お取り置きの数を踏まえ、作る数を検討', default_assignee: 'role:admin' },
          { text_ja: '味ごとに作る数を決める', default_assignee: 'role:admin' },
          { text_ja: '数確定後、スタッフに作る個数をスタッフLINEにて共有', default_assignee: 'role:admin' },
        ],
      },
      // フェーズ3: 材料準備・仕込み（営業日-3日〜当日朝）
      {
        title_ja: '材料準備と発注',
        body_ja: '必要な材料を計算し、発注する',
        relative_due_rule: '-3 days 10:00',
        tag: 'Prep',
        sort_order: 7,
        checklist_items: [
          { text_ja: 'スプレッドシートの表を印刷', default_assignee: 'role:coadmin' },
          { text_ja: '必要な材料を計算', default_assignee: 'role:coadmin' },
          { text_ja: '具材の在庫を確認して何を仕込むべきか、足りない分を計算', default_assignee: 'role:coadmin' },
          { text_ja: '材料の発注(サンヨネ、ワルツ、cotta、いちご農家さん)', default_assignee: 'role:admin' },
          { text_ja: 'いちご農家さんへはLINEで連絡して発注', default_assignee: 'role:admin' },
        ],
      },
      {
        title_ja: '仕込み作業',
        body_ja: '材料の仕込み、計量',
        relative_due_rule: '-1 days 14:00',
        tag: 'Prep',
        sort_order: 8,
        checklist_items: [
          { text_ja: '材料の仕込み、計量', default_assignee: 'role:coadmin' },
        ],
      },
      {
        title_ja: '販売準備',
        body_ja: '値札、つり銭、レジ、紙袋の準備',
        relative_due_rule: '-1 days 18:00',
        tag: 'Prep',
        sort_order: 9,
        checklist_items: [
          { text_ja: '値札の確認、無ければ作成', default_assignee: 'role:admin' },
          { text_ja: 'つり銭の準備', default_assignee: 'role:admin' },
          { text_ja: 'レジiPadの充電と準備', default_assignee: 'role:admin' },
          { text_ja: '紙袋にスタンプを押す', default_assignee: 'role:coadmin' },
        ],
      },
      {
        title_ja: '焼成作業',
        body_ja: '販売日当日にバナナブレッドとマフィンを焼く',
        relative_due_rule: '0 days 10:30',
        tag: 'Prep',
        sort_order: 10,
        checklist_items: [
          { text_ja: '販売日当日にバナナブレッドとマフィンを焼く', default_assignee: 'role:coadmin' },
          { text_ja: '取り置き分と当日分とを分けて番重に入れる', default_assignee: 'role:coadmin' },
        ],
      },
      // フェーズ4: 開店準備（営業日当日 13:00頃）
      {
        title_ja: '開店準備',
        body_ja: '開店前の準備作業',
        relative_due_rule: '0 days 13:00',
        tag: 'Opening',
        sort_order: 11,
        checklist_items: [
          { text_ja: '商品とつり銭、iPadをお店に運ぶ', default_assignee: 'role:coadmin' },
          { text_ja: '見本用の商品をショーケースに並べる', default_assignee: 'role:coadmin' },
          { text_ja: '番重を置く', default_assignee: 'role:coadmin' },
          { text_ja: 'お店の床の掃き掃除', default_assignee: 'role:worker' },
          { text_ja: 'ショーケース、カウンター、棚、キッズスペースの拭き掃除', default_assignee: 'role:coadmin' },
          { text_ja: 'お絵描きボードの用紙を替える', default_assignee: 'role:coadmin' },
          { text_ja: '傘立てとプレートをお店の外に出す', default_assignee: 'role:worker' },
          { text_ja: '駐車場の岩を移動させる', default_assignee: 'role:worker' },
          { text_ja: '駐車場のプレートを並べる', default_assignee: 'role:worker' },
          { text_ja: 'レジの準備', default_assignee: 'role:coadmin' },
          { text_ja: '調理器具を洗う', default_assignee: 'role:worker' },
          { text_ja: '乾いた調理器具を拭く、しまう', default_assignee: 'role:worker' },
          { text_ja: 'マフィンの型を拭く', default_assignee: 'role:worker' },
          { text_ja: 'マフィンの型を洗う', default_assignee: 'role:worker' },
          { text_ja: 'シンクを洗う', default_assignee: 'role:worker' },
          { text_ja: '排水口のネットを替える', default_assignee: 'role:worker' },
          { text_ja: '床の拭き掃除', default_assignee: 'role:coadmin' },
          { text_ja: '作業台の水拭き', default_assignee: 'role:coadmin' },
          { text_ja: '在庫数を確認して共有メモに数を入力', default_assignee: 'role:coadmin' },
        ],
      },
      // フェーズ5: 販売中（営業日当日）
      {
        title_ja: '販売業務',
        body_ja: '接客と販売業務',
        relative_due_rule: '0 days 14:00',
        tag: 'Sales',
        sort_order: 12,
        checklist_items: [
          { text_ja: '時間になったらお店を開けて販売開始', default_assignee: 'role:coadmin' },
          { text_ja: '接客をする', default_assignee: 'role:coadmin' },
          { text_ja: '一人ずつ注文を受けレジに入力', default_assignee: 'role:coadmin' },
          { text_ja: 'お客様に合計金額を伝える', default_assignee: 'role:coadmin' },
          { text_ja: '食品の袋詰め', default_assignee: 'role:coadmin' },
          { text_ja: 'マフィンのおいしい食べ方を同封することを伝える', default_assignee: 'role:coadmin' },
        ],
      },
      {
        title_ja: '販売中のSNS対応',
        body_ja: '在庫状況の投稿と取り置き対応',
        relative_due_rule: '0 days 15:00',
        tag: 'Promotion',
        sort_order: 13,
        checklist_items: [
          { text_ja: '客足が落ち着いたら在庫数をInstagramのストーリーズに投稿する', default_assignee: 'role:coadmin' },
          { text_ja: '数に余裕があれば当日の取り置き案内をInstagramと公式LINEにて配信する', default_assignee: 'role:admin' },
          { text_ja: 'お取り置きの連絡があれば返信する', default_assignee: 'role:admin' },
          { text_ja: '完売した場合はInstagramのストーリーズに投稿する', default_assignee: 'role:admin' },
          { text_ja: '接客の合間に次回の営業案内文を作成する', default_assignee: 'role:coadmin' },
        ],
      },
      // フェーズ6: 閉店作業（営業日当日 17:00頃）
      {
        title_ja: '閉店作業',
        body_ja: '閉店後の片付けと締め',
        relative_due_rule: '0 days 17:00',
        tag: 'Closing',
        sort_order: 14,
        checklist_items: [
          { text_ja: '時間になったら閉店', default_assignee: 'role:coadmin' },
          { text_ja: '商品が余っていたら冷凍用に袋に入れる', default_assignee: 'role:coadmin' },
          { text_ja: 'レジ閉め', default_assignee: 'role:admin' },
          { text_ja: 'カウンターとショーケースの拭き掃除', default_assignee: 'role:coadmin' },
          { text_ja: '床の掃き掃除', default_assignee: 'role:coadmin' },
          { text_ja: '駐車場のプレートを片付ける', default_assignee: 'role:worker' },
          { text_ja: '駐車場の岩を移動させる', default_assignee: 'role:worker' },
          { text_ja: '番重を工房へ運ぶ', default_assignee: 'role:coadmin' },
          { text_ja: '番重の拭き掃除', default_assignee: 'role:coadmin' },
          { text_ja: '商品が余っていたら冷凍庫へ入れる', default_assignee: 'role:coadmin' },
        ],
      },
    ]

    // Get users to resolve role-based assignees
    const { data: users } = await supabase.from('users').select('id, role')

    interface CreatedTask {
      id: string
      template_id: string
      title_ja: string
      body_ja: string | null
      relative_due_rule: string
      tag: string | null
      sort_order: number
    }
    const createdTasks: CreatedTask[] = []

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
