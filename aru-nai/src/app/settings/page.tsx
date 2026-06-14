'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { storage } from '@/lib/storage'

export default function SettingsPage() {
  const router = useRouter()
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const familyId = typeof window !== 'undefined' ? storage.getFamilyId() : null
  const familyName = typeof window !== 'undefined' ? storage.getFamilyName() : ''
  const memberName = typeof window !== 'undefined' ? storage.getMemberName() : ''

  useEffect(() => {
    if (!storage.isLoggedIn()) {
      router.replace('/onboarding/family')
      return
    }
    if (!familyId) return
    supabase
      .from('families')
      .select('invite_token')
      .eq('id', familyId)
      .single()
      .then(({ data }) => {
        if (data) {
          setInviteUrl(`${window.location.origin}/join/${data.invite_token}`)
        }
      })
  }, [familyId, router])

  const handleCopy = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* ヘッダー */}
      <header className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900">設定</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 flex flex-col gap-4">
        {/* ファミリー情報 */}
        <section className="bg-white rounded-2xl px-5 py-4 shadow-sm flex flex-col gap-1">
          <p className="text-xs text-gray-400">ファミリー</p>
          <p className="text-base font-bold text-gray-900">{familyName}</p>
          <p className="text-sm text-gray-500">{memberName}としてログイン中</p>
        </section>

        {/* 招待URL */}
        <section className="bg-white rounded-2xl px-5 py-4 shadow-sm flex flex-col gap-3">
          <p className="text-sm font-bold text-gray-700">家族を招待する</p>
          {inviteUrl ? (
            <>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 break-all">
                {inviteUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`w-full rounded-xl py-3 text-sm font-semibold transition active:scale-95 ${
                  copied
                    ? 'bg-green-100 text-green-600'
                    : 'bg-green-500 text-white'
                }`}
              >
                {copied ? 'コピーしました！' : 'URLをコピー'}
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-400">読み込み中...</p>
          )}
        </section>
      </main>
    </div>
  )
}
