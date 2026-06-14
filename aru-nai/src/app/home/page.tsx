'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { storage } from '@/lib/storage'
import type { Item, ItemStatus } from '@/types'
import ItemCard from '@/components/ItemCard'
import AddItemModal from '@/components/AddItemModal'

export default function HomePage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [showAdd, setShowAdd] = useState(false)
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `family_id=eq.${familyId}` },
        () => { fetchItems() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [familyId, fetchItems])

  const updateItemStatus = async (item: Item, newStatus: ItemStatus) => {
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

  const handleToggle = (item: Item) => {
    if (item.status === 'home') return updateItemStatus(item, 'buy')
    if (item.status === 'buy') return updateItemStatus(item, 'home')
    return updateItemStatus(item, 'buy') // none → buy (復元)
  }

  const handleArchive = (item: Item) => updateItemStatus(item, 'none')

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

  const buyItems = items.filter((i) => i.status === 'buy')
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
      {/* ヘッダー */}
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

      {/* コンテンツ */}
      <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6 pb-24">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">読み込み中...</div>
        ) : (
          <>
            {/* 買うセクション */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛒</span>
                  <h2 className="text-sm font-bold text-red-500">買う</h2>
                </div>
                <span className="bg-red-100 text-red-500 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {buyItems.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {buyItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">買うものはありません</p>
                ) : (
                  buyItems.map((item) => (
                    <ItemCard key={item.id} item={item} onToggle={handleToggle} onArchive={handleArchive} onDelete={handleDelete} />
                  ))
                )}
              </div>
            </section>

            {/* 家にあるセクション */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏠</span>
                  <h2 className="text-sm font-bold text-green-600">家にある</h2>
                </div>
                <span className="bg-green-100 text-green-600 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {homeItems.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {homeItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">家にあるものはありません</p>
                ) : (
                  homeItems.map((item) => (
                    <ItemCard key={item.id} item={item} onToggle={handleToggle} onArchive={handleArchive} onDelete={handleDelete} />
                  ))
                )}
              </div>
            </section>

            {/* 家にないセクション */}
            {noneItems.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📦</span>
                    <h2 className="text-sm font-bold text-gray-400">家にない</h2>
                  </div>
                  <span className="bg-gray-100 text-gray-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {noneItems.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {noneItems.map((item) => (
                    <ItemCard key={item.id} item={item} onToggle={handleToggle} onArchive={handleArchive} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* 追加ボタン */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <button
          onClick={() => setShowAdd(true)}
          className="pointer-events-auto flex items-center gap-2 bg-green-500 text-white rounded-full px-6 py-4 text-base font-semibold shadow-lg active:scale-95 transition"
        >
          <span className="text-xl leading-none">+</span>
          アイテムを追加
        </button>
      </div>

      {showAdd && <AddItemModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
