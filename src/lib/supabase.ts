import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// ビルド時は環境変数がなくてもエラーにしない
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Please check your .env.local file and Vercel environment settings.')
}

// 常にクライアントを作成（空文字列でも）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)