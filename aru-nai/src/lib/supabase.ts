import { createClient } from '@supabase/supabase-js'
import type { Family, Member, Item } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      families: { Row: Family }
      members: { Row: Member }
      items: { Row: Item }
    }
  }
}
