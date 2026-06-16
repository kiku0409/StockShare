'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { storage } from '@/lib/storage'

export default function InvitePage() {
  const router = useRouter()
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem('onboarding_invite_token')
    if (!token) {
      router.replace('/onboarding/family')
      return
    }
    setInviteUrl(`${window.location.origin}/join/${token}`)
  }, [router])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${storage.getFamilyName()}に参加しよう`,
          text: 'ある・ないアプリで家族の買い物リストを共有しよう！',
          url: inviteUrl,
        })
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          handleCopy()
        }
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <div className="text-5xl mb-4">👨‍👩‍👧</div>
          <h1 className="text-2xl font-bold text-gray-900">家族を招待しよう</h1>
          <p className="text-gray-500 mt-2 text-sm">
            リンクをシェアして家族を追加できます
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
          <p className="flex-1 text-sm text-gray-600 break-all">{inviteUrl}</p>
          <button
            onClick={handleCopy}
            className="shrink-0 text-green-600 font-medium text-sm"
          >
            {copied ? 'コピー済み' : 'コピー'}
          </button>
        </div>

        <button
          onClick={handleShare}
          className="w-full rounded-xl bg-green-500 text-white py-4 text-lg font-semibold active:scale-95 transition"
        >
          リンクをシェア
        </button>

        <button
          onClick={() => router.push('/home')}
          className="w-full text-gray-500 py-2 text-sm"
        >
          あとで招待する
        </button>
      </div>
    </div>
  )
}
