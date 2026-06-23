'use client'

import { useState, useEffect, useRef } from 'react'
import type { ItemStatus, Priority } from '@/types'

interface Props {
  onAdd: (name: string, status: ItemStatus, note: string, priority: Priority) => Promise<void>
  onClose: () => void
}

export default function AddItemModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 1) inputRef.current?.focus()
  }, [step])

  const handleStatusSelect = (status: ItemStatus) => {
    if (!name.trim()) return
    setSelectedStatus(status)
    setStep(2)
  }

  const handlePrioritySelect = async (priority: Priority) => {
    if (!selectedStatus || loading) return
    setLoading(true)
    await onAdd(name.trim(), selectedStatus, note.trim(), priority)
    setLoading(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl px-6 py-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 1 ? (
          <>
            <h2 className="text-lg font-bold text-gray-900">アイテムを追加</h2>

            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：牛乳"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
            />

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="備考（任意）"
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition resize-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStatusSelect('home')}
                disabled={!name.trim()}
                className="flex flex-col items-center gap-1 rounded-xl border-2 border-green-400 bg-green-50 py-4 text-green-700 font-semibold disabled:opacity-40 active:scale-95 transition"
              >
                <span className="text-2xl">🏠</span>
                <span className="text-sm">家にある</span>
              </button>

              <button
                onClick={() => handleStatusSelect('buy')}
                disabled={!name.trim()}
                className="flex flex-col items-center gap-1 rounded-xl border-2 border-red-400 bg-red-50 py-4 text-red-600 font-semibold disabled:opacity-40 active:scale-95 transition"
              >
                <span className="text-2xl">🛒</span>
                <span className="text-sm">買う</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition"
              >
                ←
              </button>
              <h2 className="text-lg font-bold text-gray-900">
                {selectedStatus === 'home' ? '在庫レベルを選択' : '優先度を選択'}
              </h2>
            </div>

            <p className="text-sm text-gray-500 text-center font-semibold">{name}</p>

            {selectedStatus === 'buy' ? (
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'urgent'  as Priority, label: '🔴', text: '至急' },
                  { value: 'soon'    as Priority, label: '🟡', text: '近日中' },
                  { value: 'anytime' as Priority, label: '⚪️', text: 'ついでに' },
                ]).map(({ value, label, text }) => (
                  <button
                    key={value}
                    onClick={() => handlePrioritySelect(value)}
                    disabled={loading}
                    className="flex flex-col items-center gap-1 rounded-xl border-2 border-gray-100 bg-gray-50 py-4 text-gray-700 font-semibold disabled:opacity-40 active:scale-95 transition"
                  >
                    <span className="text-2xl">{label}</span>
                    <span className="text-sm">{text}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'anytime' as Priority, label: '🟢', text: '豊富' },
                  { value: 'soon'    as Priority, label: '🟡', text: '残り少ない' },
                  { value: 'urgent'  as Priority, label: '🔴', text: '在庫ゼロ' },
                ]).map(({ value, label, text }) => (
                  <button
                    key={value}
                    onClick={() => handlePrioritySelect(value)}
                    disabled={loading}
                    className="flex flex-col items-center gap-1 rounded-xl border-2 border-gray-100 bg-gray-50 py-4 text-gray-700 font-semibold disabled:opacity-40 active:scale-95 transition"
                  >
                    <span className="text-2xl">{label}</span>
                    <span className="text-sm">{text}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
