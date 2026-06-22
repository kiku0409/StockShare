export type ItemStatus = 'home' | 'buy' | 'none'
export type Priority = 'urgent' | 'soon' | 'anytime'

export interface Family {
  id: string
  name: string
  invite_token: string
  created_at: string
}

export interface Member {
  id: string
  family_id: string
  display_name: string
  created_at: string
}

export interface Item {
  id: string
  family_id: string
  name: string
  status: ItemStatus
  priority: Priority
  note?: string | null
  updated_by_member_id: string | null
  updated_by_name?: string | null
  updated_at: string
  members?: { display_name: string } | null
}
