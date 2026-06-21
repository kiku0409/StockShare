'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function extractToken(input: string): string | null {
  const trimmed = input.trim()
  // Full URL: https://example.com/join/TOKEN
  const match = trimmed.match(/\/join\/([^/?#]+)/)
  if (match) return match[1]
  // Plain token (no slashes)
  if (trimmed && !trimmed.includes('/')) return trimmed
  return null
}

export default function OnboardingJoinPage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const handleJoin = () => {
    const token = extractToken(input)
    if (!token) {
      setError('有効な招待リンクまたはトークンを入力してください。')
      return
    }
    router.push(`/join/${token}`)
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <button
          onClick={() => router.back()}
          className="self-start text-gray-400 text-sm"
        >
          ← 戻る
        </button>

        <div className="text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-900">招待リンクで参加</h1>
          <p className="text-gray-500 mt-2 text-sm">
            家族から共有された招待リンクを貼り付けてください
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">招待リンク</label>
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="https://aru-nai-iota.vercel.app/join/..."
            autoFocus
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          onClick={handleJoin}
          disabled={!input.trim()}
          className="w-full rounded-xl bg-green-500 text-white py-4 text-lg font-semibold disabled:opacity-40 active:scale-95 transition"
        >
          参加する
        </button>
      </div>
    </div>
  )
}
