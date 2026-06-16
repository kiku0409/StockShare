import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 型安全性を高めるには `supabase gen types` で自動生成した型を使う
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
