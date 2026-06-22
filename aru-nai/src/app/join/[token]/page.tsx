'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { storage } from '@/lib/storage'

export default function JoinPage() {
  const router = useRouter()
  const { token } = useParams<{ token: string }>()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!storage.isLoggedIn()) {
      setChecking(false)
      return
    }

    const memberId = storage.getMemberId()
    if (!memberId) {
      storage.clear()
      setChecking(false)
      return
    }

    // メンバーがDBに存在する場合のみホームへ、削除済みなら再参加させる
    supabase
      .from('members')
      .select('id')
      .eq('id', memberId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          router.replace('/home')
        } else {
          storage.clear()
          setChecking(false)
        }
      })
  }, [router])

  if (checking) return null

  const handleJoin = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError('')

    try {
      const { data: family, error: familyErr } = await supabase
        .from('families')
        .select()
        .eq('invite_token', token)
        .single()

      if (familyErr || !family) {
        setError('招待リンクが無効です。')
        return
      }

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

      router.push('/home')
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
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900">家族に参加</h1>
          <p className="text-gray-500 mt-2 text-sm">あなたの名前を入力してください</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">名前</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="例：パパ"
            autoFocus
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          onClick={handleJoin}
          disabled={!name.trim() || loading}
          className="w-full rounded-xl bg-green-500 text-white py-4 text-lg font-semibold disabled:opacity-40 active:scale-95 transition"
        >
          {loading ? '参加中...' : '参加する'}
        </button>
      </div>
    </div>
  )
}
