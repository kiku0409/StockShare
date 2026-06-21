'use client'

import { useState, useEffect, useRef } from 'react'
import type { ItemStatus } from '@/types'

interface Props {
  onAdd: (name: string, status: ItemStatus, note: string) => Promise<void>
  onClose: () => void
}

export default function AddItemModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleAdd = async (status: ItemStatus) => {
    if (!name.trim() || loading) return
    setLoading(true)
    await onAdd(name.trim(), status, note.trim())
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
            onClick={() => handleAdd('home')}
            disabled={!name.trim() || loading}
            className="flex flex-col items-center gap-1 rounded-xl border-2 border-green-400 bg-green-50 py-4 text-green-700 font-semibold disabled:opacity-40 active:scale-95 transition"
          >
            <span className="text-2xl">🏠</span>
            <span className="text-sm">家にある</span>
          </button>

          <button
            onClick={() => handleAdd('buy')}
            disabled={!name.trim() || loading}
            className="flex flex-col items-center gap-1 rounded-xl border-2 border-red-400 bg-red-50 py-4 text-red-600 font-semibold disabled:opacity-40 active:scale-95 transition"
          >
            <span className="text-2xl">🛒</span>
            <span className="text-sm">買う</span>
          </button>
        </div>
      </div>
    </div>
  )
}
