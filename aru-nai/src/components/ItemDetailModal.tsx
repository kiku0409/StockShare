'use client'

import { useState } from 'react'
import type { Item, ItemStatus, Priority } from '@/types'
import { getItemColor } from '@/lib/itemColor'
import { formatRelativeTime } from '@/lib/time'

interface Props {
  item: Item
  onStatusChange: (item: Item, status: ItemStatus) => void
  onStockChange?: (item: Item, priority: Priority) => void
  onDelete: (item: Item) => void
  onClose: () => void
}

export default function ItemDetailModal({ item, onStatusChange, onStockChange, onDelete, onClose }: Props) {
  const colorClass = getItemColor(item.name)
  const updaterName = item.members?.display_name ?? item.updated_by_name ?? '不明'
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleStatus = (status: ItemStatus) => {
    if (item.status !== status) onStatusChange(item, status)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl px-6 pt-4 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3 ${colorClass}`}>
          {item.name[0] ?? '？'}
        </div>
        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">{item.name}</h2>
        <p className="text-xs text-center text-gray-400 mb-3">
          {updaterName}が{formatRelativeTime(item.updated_at)}に更新
        </p>
        {item.note && (
          <p className="text-sm text-gray-500 text-center bg-gray-50 rounded-xl px-4 py-3 mb-3">
            {item.note}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => handleStatus('home')}
            className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-4 font-semibold transition active:scale-95 ${
              item.status === 'home'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-100 bg-gray-50 text-gray-500'
            }`}
          >
            <span className="text-2xl">🏠</span>
            <span className="text-sm">家にある</span>
          </button>
          <button
            onClick={() => handleStatus('buy')}
            className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-4 font-semibold transition active:scale-95 ${
              item.status === 'buy'
                ? 'border-red-400 bg-red-50 text-red-600'
                : 'border-gray-100 bg-gray-50 text-gray-500'
            }`}
          >
            <span className="text-2xl">🛒</span>
            <span className="text-sm">買う</span>
          </button>
        </div>

        {item.status === 'home' && onStockChange && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {([
              { value: 'anytime' as Priority, label: '🟢', text: '豊富' },
              { value: 'soon'    as Priority, label: '🟡', text: '残り少ない' },
              { value: 'urgent'  as Priority, label: '🔴', text: '在庫ゼロ' },
            ]).map(({ value, label, text }) => (
              <button
                key={value}
                onClick={() => { onStockChange(item, value); onClose() }}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-3 font-semibold transition active:scale-95 ${
                  (item.priority ?? 'anytime') === value
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-100 bg-gray-50 text-gray-500'
                }`}
              >
                <span className="text-xl">{label}</span>
                <span className="text-xs">{text}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => handleStatus('none')}
          className={`w-full rounded-2xl border-2 py-3 text-sm font-semibold transition active:scale-95 mb-3 ${
            item.status === 'none'
              ? 'border-gray-400 bg-gray-100 text-gray-600'
              : 'border-gray-100 bg-gray-50 text-gray-400'
          }`}
        >
          📦 家にない
        </button>

        {confirmDelete ? (
          <div className="flex gap-2">
            <button
              onClick={() => { onDelete(item); onClose() }}
              className="flex-1 rounded-2xl border-2 border-red-400 bg-red-500 py-3 text-sm font-semibold text-white transition active:scale-95"
            >
              本当に削除する
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-2xl border-2 border-gray-100 bg-gray-50 py-3 text-sm font-semibold text-gray-500 transition active:scale-95"
            >
              戻る
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full rounded-2xl border-2 border-red-100 py-3 text-sm font-semibold text-red-400 transition active:scale-95"
          >
            削除する
          </button>
        )}
      </div>
    </div>
  )
}
