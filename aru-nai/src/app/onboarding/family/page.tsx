'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FamilyNamePage() {
  const router = useRouter()
  const [name, setName] = useState('')

  const handleNext = () => {
    if (!name.trim()) return
    sessionStorage.setItem('onboarding_family_name', name.trim())
    router.push('/onboarding/member')
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900">家族を作成</h1>
          <p className="text-gray-500 mt-2 text-sm">家族の名前を入力してください</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">家族名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            placeholder="例：山中家"
            autoFocus
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
          />
        </div>

        <button
          onClick={handleNext}
          disabled={!name.trim()}
          className="w-full rounded-xl bg-green-500 text-white py-4 text-lg font-semibold disabled:opacity-40 active:scale-95 transition"
        >
          次へ
        </button>
      </div>
    </div>
  )
}
