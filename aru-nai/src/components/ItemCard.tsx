'use client'

import type { Item } from '@/types'

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}時間前`
  const days = Math.floor(hours / 24)
  if (days === 1) return '昨日'
  return `${days}日前`
}

interface Props {
  item: Item
  onToggle: (item: Item) => void
  onDelete: (item: Item) => void
}

export default function ItemCard({ item, onToggle, onDelete }: Props) {
  const updaterName = item.members?.display_name ?? '不明'
  const timeAgo = formatRelativeTime(item.updated_at)

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm active:scale-[0.98] transition select-none">
      <button
        onClick={() => onToggle(item)}
        className="flex-1 flex flex-col gap-0.5 text-left min-w-0"
      >
        <span className="text-base font-medium text-gray-900 truncate">{item.name}</span>
        <span className="text-xs text-gray-400">
          {updaterName}が{timeAgo}に更新
        </span>
      </button>

      <button
        onClick={() => onDelete(item)}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition"
        aria-label="削除"
      >
        ×
      </button>
    </div>
  )
}
