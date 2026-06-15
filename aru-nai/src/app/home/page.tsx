'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { storage } from '@/lib/storage'
import type { Item, ItemStatus, Priority } from '@/types'
import ItemCard from '@/components/ItemCard'
import AddItemModal from '@/components/AddItemModal'
import ItemDetailModal from '@/components/ItemDetailModal'

const PRIORITY_CYCLE: Priority[] = ['anytime', 'urgent', 'soon']
const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, soon: 1, anytime: 2 }

export default function HomePage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)

  const familyId = typeof window !== 'undefined' ? storage.getFamilyId() : null
  const memberId = typeof window !== 'undefined' ? storage.getMemberId() : null
  const familyName = typeof window !== 'undefined' ? storage.getFamilyName() : ''
  const memberName = typeof window !== 'undefined' ? storage.getMemberName() : ''

  const fetchItems = useCallback(async () => {
    if (!familyId) return
    const { data } = await supabase
      .from('items')
      .select('*, members(display_name)')
      .eq('family_id', familyId)
      .order('updated_at', { ascending: false })
    setItems((data as Item[]) ?? [])
    setLoading(false)
  }, [familyId])

  useEffect(() => {
    if (!storage.isLoggedIn()) {
      router.replace('/onboarding/family')
      return
    }
    fetchItems()
  }, [fetchItems, router])

  useEffect(() => {
    if (!familyId) return
    const channel = supabase
      .channel(`items:${familyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `family_id=eq.${familyId}` }, fetchItems)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [familyId, fetchItems])

  const handleStatusChange = async (item: Item, newStatus: ItemStatus) => {
    await supabase
      .from('items')
      .update({ status: newStatus, updated_by_member_id: memberId, updated_at: new Date().toISOString() })
      .eq('id', item.id)
    setItems((prev) =>
      prev.map((i) => i.id === item.id
        ? { ...i, status: newStatus, updated_at: new Date().toISOString(), members: { id: memberId!, family_id: familyId!, display_name: memberName!, created_at: '' } }
        : i
      )
    )
  }

  const handlePriorityChange = async (item: Item) => {
    const current = item.priority ?? 'anytime'
    const next = PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(current) + 1) % PRIORITY_CYCLE.length]
    await supabase.from('items').update({ priority: next }).eq('id', item.id)
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, priority: next } : i))
  }

  const handleDelete = async (item: Item) => {
    await supabase.from('items').delete().eq('id', item.id)
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  const handleAdd = async (name: string, status: ItemStatus) => {
    const { data } = await supabase
      .from('items')
      .insert({ family_id: familyId, name, status, updated_by_member_id: memberId })
      .select('*, members(display_name)')
      .single()
    if (data) setItems((prev) => [data as Item, ...prev])
  }

  const buyItems = items
    .filter((i) => i.status === 'buy')
    .sort((a, b) => PRIORITY_ORDER[a.priority ?? 'anytime'] - PRIORITY_ORDER[b.priority ?? 'anytime'])
  const homeItems = items.filter((i) => i.status === 'home')
  const noneItems = items.filter((i) => i.status === 'none')

  const activeItems = items.filter((i) => i.status !== 'none')
  const lastUpdated = activeItems[0]
    ? (() => {
        const diff = Date.now() - new Date(activeItems[0].updated_at).getTime()
        const min = Math.floor(diff / 60000)
        const name = activeItems[0].members?.display_name ?? ''
        if (min < 1) return `${name}がたった今更新`
        if (min < 60) return `${name}が${min}分前に更新`
        return `${name}が${Math.floor(min / 60)}時間前に更新`
      })()
    : null

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col max-w-lg mx-auto">
      <header className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👨‍👩‍👧</span>
            <h1 className="text-lg font-bold text-gray-900">{familyName}</h1>
          </div>
          <button
            onClick={() => router.push('/settings')}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400"
          >
            ⚙
          </button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-400 mt-1">最終更新：{lastUpdated}</p>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 pb-36">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">読み込み中...</div>
        ) : (
          <>
            <section>
              <div className="flex items-center justify-between bg-red-50 rounded-xl px-4 py-2 mb-2">
                <div className="flex items-center gap-2">
                  <span>🛒</span>
                  <h2 className="text-sm font-bold text-red-500">買う</h2>
                </div>
                <span className="bg-red-400 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {buyItems.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {buyItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">買うものはありません</p>
                ) : (
                  buyItems.map((item) => (
                    <ItemCard key={item.id} item={item} onClick={setSelectedItem} onPriorityChange={handlePriorityChange} />
                  ))
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-2 mb-2">
                <div className="flex items-center gap-2">
                  <span>🏠</span>
                  <h2 className="text-sm font-bold text-green-600">家にある</h2>
                </div>
                <span className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {homeItems.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {homeItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">家にあるものはありません</p>
                ) : (
                  homeItems.map((item) => (
                    <ItemCard key={item.id} item={item} onClick={setSelectedItem} />
                  ))
                )}
              </div>
            </section>

            {noneItems.length > 0 && (
              <section>
                <div className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span>📦</span>
                    <h2 className="text-sm font-bold text-gray-400">家にない</h2>
                  </div>
                  <span className="bg-gray-400 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {noneItems.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {noneItems.map((item) => (
                    <ItemCard key={item.id} item={item} onClick={setSelectedItem} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white">
        <div className="px-4 pt-3 pb-2">
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white rounded-full py-3.5 text-base font-semibold shadow-md active:scale-95 transition"
          >
            <span className="text-xl leading-none">+</span>
            アイテムを追加
          </button>
        </div>
        <nav className="flex border-t border-gray-100">
          <button className="flex-1 flex flex-col items-center gap-0.5 py-2 text-green-500">
            <span className="text-xl">🏠</span>
            <span className="text-xs font-medium">ホーム</span>
          </button>
          <button
            onClick={() => router.push('/members')}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 text-gray-400"
          >
            <span className="text-xl">👥</span>
            <span className="text-xs font-medium">メンバー</span>
          </button>
        </nav>
      </div>

      {showAdd && <AddItemModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}
