'use client'

import { useRef, useState, useEffect } from 'react'
import type { Item } from '@/types'
import { getItemColor } from '@/lib/itemColor'
import { formatRelativeTime } from '@/lib/time'

const PRIORITY_BAR: Record<string, string> = {
  urgent:  'bg-red-400',
  soon:    'bg-amber-400',
  anytime: 'bg-gray-200',
}

const STOCK_BAR: Record<string, string> = {
  urgent:  'bg-red-400',
  soon:    'bg-amber-400',
  anytime: 'bg-green-200',
}

const SWIPE_DELETE_THRESHOLD = 72

interface Props {
  item: Item
  onToggle: (item: Item) => void
  onDetail: (item: Item) => void
  onPriorityChange?: (item: Item) => void
  onDelete?: (item: Item) => void
}

export default function ItemCard({ item, onToggle, onDetail, onPriorityChange, onDelete }: Props) {
  const updaterName = item.members?.display_name ?? item.updated_by_name ?? '不明'
  const timeAgo = formatRelativeTime(item.updated_at)
  const colorClass = getItemColor(item.name)
  const isNone = item.status === 'none'
  const priorityBar = item.status === 'home'
    ? STOCK_BAR[item.priority ?? 'anytime']
    : PRIORITY_BAR[item.priority ?? 'anytime']

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const [swipeX, setSwipeX] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const isDragging = useRef(false)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
    }
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isDragging.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    if (!isDragging.current && Math.abs(dy) > Math.abs(dx)) return
    if (dx < 0) {
      isDragging.current = true
      e.preventDefault()
      setSwipeX(Math.max(dx, -SWIPE_DELETE_THRESHOLD - 20))
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging.current) return
    if (swipeX <= -SWIPE_DELETE_THRESHOLD && onDelete) {
      setIsDeleting(true)
      deleteTimerRef.current = setTimeout(() => onDelete(item), 250)
    } else {
      setSwipeX(0)
    }
    isDragging.current = false
  }

  if (isDeleting) return null

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* 削除背景 */}
      <div className="absolute inset-0 flex items-center justify-end bg-red-500 rounded-2xl pr-5">
        <span className="text-white text-xl">🗑</span>
      </div>

      {/* カード本体 */}
      <div
        className={`flex bg-white rounded-2xl shadow-sm w-full ${isNone ? 'opacity-50' : ''}`}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.25s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 優先度 / 在庫バー */}
        {(item.status === 'buy' || item.status === 'home') && onPriorityChange && (
          <button
            onClick={() => onPriorityChange(item)}
            className={`w-5 shrink-0 rounded-l-2xl ${priorityBar}`}
            aria-label={item.status === 'home' ? '在庫レベルを変更' : '優先度を変更'}
          />
        )}

        {/* メインコンテンツ */}
        <button
          onClick={() => onToggle(item)}
          className="flex-1 flex items-center gap-3 px-4 py-3 text-left active:bg-gray-50 transition"
        >
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${colorClass}`}>
            {item.name[0] ?? '？'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <p className={`text-sm font-semibold shrink-0 max-w-[55%] truncate ${isNone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                {item.name}
              </p>
              {item.note && (
                <span className="text-xs text-gray-400 truncate flex-1 min-w-0">{item.note}</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {isNone ? '家にない' : `${updaterName}・${timeAgo}`}
            </p>
          </div>
        </button>

        {/* 詳細ボタン */}
        <button
          onClick={(e) => { e.stopPropagation(); onDetail(item) }}
          className="shrink-0 px-3 flex items-center text-gray-200 active:text-gray-400 transition text-xl"
        >
          ›
        </button>
      </div>
    </div>
  )
}
