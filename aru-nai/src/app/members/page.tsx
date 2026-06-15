'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { storage } from '@/lib/storage'
import type { Member } from '@/types'

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])

  const familyId = typeof window !== 'undefined' ? storage.getFamilyId() : null
  const memberId = typeof window !== 'undefined' ? storage.getMemberId() : null
  const familyName = typeof window !== 'undefined' ? storage.getFamilyName() : ''

  useEffect(() => {
    if (!storage.isLoggedIn()) { router.replace('/onboarding/family'); return }
    if (!familyId) return
    supabase
      .from('members')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at')
      .then(({ data }) => setMembers((data as Member[]) ?? []))
  }, [familyId, router])

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col max-w-lg mx-auto">
      <header className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">👨‍👩‍👧</span>
          <h1 className="text-lg font-bold text-gray-900">{familyName}</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 flex flex-col gap-2 pb-24">
        <p className="text-xs text-gray-400 font-medium px-1 mb-1">メンバー</p>
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-base font-bold text-green-600">
              {m.display_name[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{m.display_name}</p>
              {m.id === memberId && <p className="text-xs text-green-500">あなた</p>}
            </div>
          </div>
        ))}
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white">
        <nav className="flex border-t border-gray-100">
          <button
            onClick={() => router.push('/home')}
            className="flex-1 flex flex-col items-center gap-0.5 py-3 text-gray-400"
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs font-medium">ホーム</span>
          </button>
          <button className="flex-1 flex flex-col items-center gap-0.5 py-3 text-green-500">
            <span className="text-xl">👥</span>
            <span className="text-xs font-medium">メンバー</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
