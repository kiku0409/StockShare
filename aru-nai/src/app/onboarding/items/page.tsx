'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { storage } from '@/lib/storage'

const CATEGORIES = [
  {
    label: '食品',
    items: ['卵', '牛乳', '食パン', '米', '豆腐', '納豆', 'ヨーグルト', 'チーズ', 'バター'],
  },
  {
    label: '調味料',
    items: ['醤油', '塩', '砂糖', 'みそ', 'マヨネーズ', 'ケチャップ', 'ごま油', 'みりん', '酢', 'だし'],
  },
  {
    label: '日用品',
    items: ['トイレットペーパー', 'シャンプー', 'ティッシュ', '洗剤', 'サランラップ', 'キッチンペーパー', 'ゴミ袋', '歯磨き粉'],
  },
]

export default function OnboardingItemsPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const familyId = useRef(storage.getFamilyId()).current
  const memberId = useRef(storage.getMemberId()).current

  const toggle = (item: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(item) ? next.delete(item) : next.add(item)
      return next
    })
  }

  const handleDone = async () => {
    if (selected.size === 0) {
      router.push('/home')
      return
    }
    setLoading(true)
    const rows = Array.from(selected).map((name) => ({
      family_id: familyId,
      name,
      status: 'home' as const,
      updated_by_member_id: memberId,
    }))
    await supabase.from('items').insert(rows)
    router.push('/home')
  }

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <div className="px-6 pt-16 pb-4">
        <div className="text-4xl mb-4">🏠</div>
        <h1 className="text-2xl font-bold text-gray-900">今家にあるものは？</h1>
        <p className="text-gray-500 mt-2 text-sm">
          タップして選んでください。あとから変更できます。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-36 flex flex-col gap-6">
        {CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <p className="text-xs font-bold text-gray-400 mb-2">{cat.label}</p>
            <div className="flex flex-wrap gap-2">
              {cat.items.map((item) => (
                <button
                  key={item}
                  onClick={() => toggle(item)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition active:scale-95 ${
                    selected.has(item)
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white px-6 pt-3 pb-10 flex flex-col gap-2 shadow-[0_-1px_0_#f0f0f0]">
        <button
          onClick={handleDone}
          disabled={loading}
          className="w-full rounded-xl bg-green-500 text-white py-4 text-base font-semibold disabled:opacity-40 active:scale-95 transition"
        >
          {loading ? '登録中...' : selected.size > 0 ? `${selected.size}件を登録してはじめる` : 'スキップしてはじめる'}
        </button>
      </div>
    </div>
  )
}
