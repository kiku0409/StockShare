'use client'

import type { Item } from '@/types'
import { getItemColor } from '@/lib/itemColor'

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

const PRIORITY_STYLE = {
  urgent:  { pill: 'bg-red-50 text-red-500',    label: '🔴 至急' },
  soon:    { pill: 'bg-amber-50 text-amber-600', label: '🟡 近日中' },
  anytime: { pill: 'bg-gray-100 text-gray-400',  label: '⚪️ ついでに' },
}

interface Props {
  item: Item
  onClick: (item: Item) => void
  onPriorityChange?: (item: Item) => void
}

export default function ItemCard({ item, onClick, onPriorityChange }: Props) {
  const updaterName = item.members?.display_name ?? '不明'
  const timeAgo = formatRelativeTime(item.updated_at)
  const colorClass = getItemColor(item.name)
  const isNone = item.status === 'none'
  const priority = PRIORITY_STYLE[item.priority ?? 'anytime']

  return (
    <button
      onClick={() => onClick(item)}
      className={`flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm w-full text-left active:scale-[0.98] transition ${isNone ? 'opacity-50' : ''}`}
    >
      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${colorClass}`}>
        {item.name[0] ?? '？'}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isNone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {item.name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {isNone ? '家にない' : `${updaterName}が${timeAgo}に更新`}
        </p>
      </div>

      {item.status === 'buy' && onPriorityChange && (
        <button
          onClick={(e) => { e.stopPropagation(); onPriorityChange(item) }}
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold transition active:scale-90 ${priority.pill}`}
        >
          {priority.label}
        </button>
      )}

      <span className="shrink-0 text-gray-300 text-lg">›</span>
    </button>
  )
}
