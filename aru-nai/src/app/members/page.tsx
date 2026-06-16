'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { storage } from '@/lib/storage'
import { getItemColor } from '@/lib/itemColor'
import type { Member } from '@/types'

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])

  const familyId = useRef(storage.getFamilyId()).current
  const memberId = useRef(storage.getMemberId()).current
  const familyName = useRef(storage.getFamilyName()).current

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">👨‍👩‍👧</span>
            <h1 className="text-lg font-bold text-gray-900">{familyName}</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 flex flex-col gap-2">
        <p className="text-xs text-gray-400 font-medium px-1 mb-1">メンバー</p>
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${getItemColor(m.display_name)}`}>
              {m.display_name[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{m.display_name}</p>
              {m.id === memberId && <p className="text-xs text-green-500">あなた</p>}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
