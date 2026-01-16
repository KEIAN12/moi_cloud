import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// ビルド時や環境変数が未設定の場合でもエラーにならないようにダミーURLを使用
const safeUrl = supabaseUrl || 'https://placeholder.supabase.co'
const safeKey = supabaseAnonKey || 'placeholder-key'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are not configured. Using placeholder.')
}

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: false,
  },
})
