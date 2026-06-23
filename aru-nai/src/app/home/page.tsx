'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { storage } from '@/lib/storage'
import { formatRelativeTime } from '@/lib/time'
import type { Item, ItemStatus, Priority } from '@/types'
import ItemCard from '@/components/ItemCard'
import AddItemModal from '@/components/AddItemModal'
import ItemDetailModal from '@/components/ItemDetailModal'
import { usePushNotification } from '@/hooks/usePushNotification'

const PRIORITY_CYCLE: Priority[] = ['anytime', 'soon', 'urgent']
const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, soon: 1, anytime: 2 }

export default function HomePage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [priorityFilter, setPriorityFilter] = useState<Set<Priority>>(new Set())
  const [stockFilter, setStockFilter] = useState<Set<Priority>>(new Set())

  // localStorage は初回レンダリング時のみ読む
  const familyId = useRef(storage.getFamilyId()).current
  const memberId = useRef(storage.getMemberId()).current
  const familyName = useRef(storage.getFamilyName()).current ?? ''
  const memberName = useRef(storage.getMemberName()).current ?? ''

  usePushNotification(familyId, memberId)

  const fetchItems = useCallback(async () => {
    if (!familyId) return
    const { data, error } = await supabase
      .from('items')
      .select('*, members(display_name)')
      .eq('family_id', familyId)
      .order('updated_at', { ascending: false })
    if (error) { console.error('fetchItems failed:', error); return }
    setItems((data as Item[]) ?? [])
    setLoading(false)
  }, [familyId])

  useEffect(() => {
    if (!storage.isLoggedIn()) {
      router.replace('/onboarding/family')
      return
    }

    if (!memberId) {
      storage.clear()
      router.replace('/onboarding/family')
      return
    }

    supabase
      .from('members')
      .select('id')
      .eq('id', memberId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { fetchItems(); return }  // network error - fail open
        if (!data) {
          storage.clear()
          router.replace('/onboarding/family')
          return
        }
        fetchItems()
      })
  }, [fetchItems, memberId, router])

  // 自分が削除されたらリアルタイムでログアウト
  useEffect(() => {
    if (!memberId) return
    const channel = supabase
      .channel(`member:${memberId}`)
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'members', filter: `id=eq.${memberId}` },
        () => {
          storage.clear()
          router.replace('/onboarding/family')
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [memberId, router])

  // Realtime: 全件再取得ではなく差分更新（#3）
  useEffect(() => {
    if (!familyId) return
    const channel = supabase
      .channel(`items:${familyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `family_id=eq.${familyId}` },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setItems((prev) => prev.filter((i) => i.id !== (payload.old as { id: string }).id))
          } else if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('items')
              .select('*, members(display_name)')
              .eq('id', (payload.new as { id: string }).id)
              .single()
            if (data) setItems((prev) => [data as Item, ...prev.filter((i) => i.id !== data.id)])
          } else if (payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('items')
              .select('*, members(display_name)')
              .eq('id', (payload.new as { id: string }).id)
              .single()
            if (data) setItems((prev) => prev.map((i) => i.id === data.id ? data as Item : i))
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [familyId])

  const handleStatusChange = async (item: Item, newStatus: ItemStatus) => {
    const now = new Date().toISOString()
    // ステータス変更時に priority をリセット（#6: buy→home で在庫レベルが誤引き継ぎされるのを防ぐ）
    const updates = {
      status: newStatus,
      priority: 'anytime' as Priority,
      updated_by_member_id: memberId,
      updated_by_name: memberName,
      updated_at: now,
    }
    const { error } = await supabase.from('items').update(updates).eq('id', item.id)
    if (error) { console.error('handleStatusChange failed:', error); return }
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, ...updates, members: { display_name: memberName } }
          : i
      )
    )
    if (item.status === 'buy' && newStatus === 'home') {
      fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          title: 'ある・ない',
          body: `✅ ${item.name}が家にあるに移動されました`,
          exclude_member_id: memberId,
        }),
      }).catch(() => {})
    }
  }

  const handlePriorityChange = async (item: Item) => {
    const current = item.priority ?? 'anytime'
    const next = PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(current) + 1) % PRIORITY_CYCLE.length]
    const { error } = await supabase.from('items').update({ priority: next }).eq('id', item.id)
    if (error) { console.error('handlePriorityChange failed:', error); return }
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, priority: next } : i))
    if (item.status === 'buy' && next === 'urgent') {
      fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          title: 'ある・ない',
          body: `⚡ ${item.name}が至急になりました`,
          exclude_member_id: memberId,
        }),
      }).catch(() => {})
    }
  }

  const handleStockSet = async (item: Item, priority: Priority) => {
    const { error } = await supabase.from('items').update({ priority }).eq('id', item.id)
    if (error) { console.error('handleStockSet failed:', error); return }
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, priority } : i))
  }

  const STOCK_CYCLE: Priority[] = ['anytime', 'soon', 'urgent']
  const handleStockChange = async (item: Item) => {
    const current = item.priority ?? 'anytime'
    const next = STOCK_CYCLE[(STOCK_CYCLE.indexOf(current) + 1) % STOCK_CYCLE.length]
    const { error } = await supabase.from('items').update({ priority: next }).eq('id', item.id)
    if (error) { console.error('handleStockChange failed:', error); return }
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, priority: next } : i))
  }

  const handleStatusToggle = async (item: Item) => {
    const newStatus: ItemStatus = item.status === 'buy' ? 'home' : 'buy'
    await handleStatusChange(item, newStatus)
  }

  const handleDelete = async (item: Item) => {
    const { error } = await supabase.from('items').delete().eq('id', item.id)
    if (error) { console.error('handleDelete failed:', error); return }
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  const handleAdd = async (name: string, status: ItemStatus, note: string, priority: Priority = 'anytime') => {
    const { data, error } = await supabase
      .from('items')
      .insert({ family_id: familyId, name, status, priority, note: note || null, updated_by_member_id: memberId, updated_by_name: memberName })
      .select('*, members(display_name)')
      .single()
    if (error) { console.error('handleAdd failed:', error); return }
    if (data) setItems((prev) => [data as Item, ...prev])
    if (status === 'buy') {
      fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          title: 'ある・ない',
          body: `🛒 ${name}が買い物リストに追加されました`,
          exclude_member_id: memberId,
        }),
      }).catch(() => {})
    }
  }

  const buyItems = items
    .filter((i) => i.status === 'buy')
    .sort((a, b) => PRIORITY_ORDER[a.priority ?? 'anytime'] - PRIORITY_ORDER[b.priority ?? 'anytime'])
  const homeItems = items
    .filter((i) => i.status === 'home')
    .sort((a, b) => PRIORITY_ORDER[a.priority ?? 'anytime'] - PRIORITY_ORDER[b.priority ?? 'anytime'])
  const noneItems = items.filter((i) => i.status === 'none')

  const displayedBuyItems = priorityFilter.size === 0
    ? buyItems
    : buyItems.filter((i) => priorityFilter.has(i.priority ?? 'anytime'))

  const displayedHomeItems = stockFilter.size === 0
    ? homeItems
    : homeItems.filter((i) => stockFilter.has(i.priority ?? 'anytime'))

  const activeItems = items.filter((i) => i.status !== 'none')
  const lastUpdated = activeItems[0]
    ? (() => {
        const name = activeItems[0].members?.display_name ?? activeItems[0].updated_by_name ?? ''
        return `${name}が${formatRelativeTime(activeItems[0].updated_at)}に更新`
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

      <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 pb-28">
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
              {buyItems.length > 0 && (
                <div className="flex gap-1.5 mb-2 overflow-x-auto pb-0.5">
                  <button
                    onClick={() => setPriorityFilter(new Set())}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition active:scale-95 ${
                      priorityFilter.size === 0
                        ? 'bg-red-400 text-white'
                        : 'bg-white text-gray-400 border border-gray-200'
                    }`}
                  >
                    全て
                  </button>
                  {([
                    { value: 'urgent',  label: '🔴 至急' },
                    { value: 'soon',    label: '🟡 近日中' },
                    { value: 'anytime', label: '⚪️ ついでに' },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setPriorityFilter((prev) => {
                        const next = new Set(prev)
                        next.has(value) ? next.delete(value) : next.add(value)
                        return next
                      })}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition active:scale-95 ${
                        priorityFilter.has(value)
                          ? 'bg-red-400 text-white'
                          : 'bg-white text-gray-400 border border-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2">
                {displayedBuyItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">
                    {priorityFilter.size > 0 ? 'このカテゴリのアイテムはありません' : '買うものはありません'}
                  </p>
                ) : (
                  displayedBuyItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onToggle={handleStatusToggle}
                      onDetail={setSelectedItem}
                      onPriorityChange={handlePriorityChange}
                      onDelete={handleDelete}
                    />
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
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-green-200 inline-block" />豊富
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block ml-1.5" />残り少ない
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block ml-1.5" />在庫ゼロ
                  </div>
                  <span className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {homeItems.length}
                  </span>
                </div>
              </div>
              {homeItems.length > 0 && (
                <div className="flex gap-1.5 mb-2 overflow-x-auto pb-0.5">
                  <button
                    onClick={() => setStockFilter(new Set())}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition active:scale-95 ${
                      stockFilter.size === 0
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-400 border border-gray-200'
                    }`}
                  >
                    全て
                  </button>
                  {([
                    { value: 'anytime', label: '🟢 豊富' },
                    { value: 'soon',    label: '🟡 残り少ない' },
                    { value: 'urgent',  label: '🔴 在庫ゼロ' },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setStockFilter((prev) => {
                        const next = new Set(prev)
                        next.has(value) ? next.delete(value) : next.add(value)
                        return next
                      })}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition active:scale-95 ${
                        stockFilter.has(value)
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-gray-400 border border-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2">
                {displayedHomeItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">
                    {stockFilter.size > 0 ? 'このカテゴリのアイテムはありません' : '家にあるものはありません'}
                  </p>
                ) : (
                  displayedHomeItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onToggle={handleStatusToggle}
                      onDetail={setSelectedItem}
                      onPriorityChange={handleStockChange}
                      onDelete={handleDelete}
                    />
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
                    <ItemCard
                      key={item.id}
                      item={item}
                      onToggle={handleStatusToggle}
                      onDetail={setSelectedItem}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 pb-8 pt-3 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none">
        <button
          onClick={() => setShowAdd(true)}
          className="pointer-events-auto w-full flex items-center justify-center gap-2 bg-green-500 text-white rounded-full py-3.5 text-base font-semibold shadow-md active:scale-95 transition"
        >
          <span className="text-xl leading-none">+</span>
          アイテムを追加
        </button>
      </div>

      {showAdd && <AddItemModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onStatusChange={handleStatusChange}
          onStockChange={handleStockSet}
          onDelete={handleDelete}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}
