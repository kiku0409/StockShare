'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { storage } from '@/lib/storage'

export default function MemberNamePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleNext = async () => {
    if (!name.trim()) return
    const familyName = sessionStorage.getItem('onboarding_family_name')
    if (!familyName) {
      router.replace('/onboarding/family')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: family, error: familyErr } = await supabase
        .from('families')
        .insert({ name: familyName })
        .select()
        .single()

      if (familyErr) throw familyErr

      const { data: member, error: memberErr } = await supabase
        .from('members')
        .insert({ family_id: family.id, display_name: name.trim() })
        .select()
        .single()

      if (memberErr) throw memberErr

      storage.setSession({
        memberId: member.id,
        familyId: family.id,
        memberName: member.display_name,
        familyName: family.name,
      })

      sessionStorage.setItem('onboarding_invite_token', family.invite_token)
      router.push('/onboarding/invite')
    } catch {
      setError('エラーが発生しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <div className="text-5xl mb-4">👤</div>
          <h1 className="text-2xl font-bold text-gray-900">あなたの名前を入力</h1>
          <p className="text-gray-500 mt-2 text-sm">家族に表示される名前です</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">名前</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            placeholder="例：きく"
            autoFocus
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          onClick={handleNext}
          disabled={!name.trim() || loading}
          className="w-full rounded-xl bg-green-500 text-white py-4 text-lg font-semibold disabled:opacity-40 active:scale-95 transition"
        >
          {loading ? '作成中...' : '次へ'}
        </button>
      </div>
    </div>
  )
}
