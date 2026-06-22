'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { storage } from '@/lib/storage'
import { getItemColor } from '@/lib/itemColor'

export default function SettingsPage() {
  const router = useRouter()
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [members, setMembers] = useState<{ id: string; display_name: string }[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const familyId = typeof window !== 'undefined' ? storage.getFamilyId() : null
  const familyName = typeof window !== 'undefined' ? storage.getFamilyName() : ''
  const memberName = typeof window !== 'undefined' ? storage.getMemberName() : ''
  const memberId = typeof window !== 'undefined' ? storage.getMemberId() : null

  useEffect(() => {
    if (!storage.isLoggedIn()) {
      router.replace('/onboarding/family')
      return
    }
    if (!familyId || !memberId) {
      storage.clear()
      router.replace('/onboarding/family')
      return
    }

    supabase
      .from('members')
      .select('id')
      .eq('id', memberId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          storage.clear()
          router.replace('/onboarding/family')
        }
      })

    supabase
      .from('families')
      .select('invite_token')
      .eq('id', familyId)
      .single()
      .then(({ data }) => {
        if (data) setInviteUrl(`${window.location.origin}/join/${data.invite_token}`)
      })

    supabase
      .from('members')
      .select('id, display_name')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMembers(data ?? []))
  }, [familyId, router])

  const handleCopy = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeleteMember = async (targetId: string) => {
    setDeleteError(null)
    // 自分のアイテムのupdated_by_member_idをnullに更新してからメンバー削除
    await supabase
      .from('items')
      .update({ updated_by_member_id: null })
      .eq('updated_by_member_id', targetId)

    const { error } = await supabase.from('members').delete().eq('id', targetId)
    if (error) {
      setDeleteError('削除できませんでした')
      setConfirmDeleteId(null)
      return
    }

    setMembers((prev) => prev.filter((m) => m.id !== targetId))
    setConfirmDeleteId(null)

    // 自分自身を削除した場合はログアウト
    if (targetId === memberId) {
      storage.clear()
      router.replace('/onboarding/family')
    }
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col max-w-lg mx-auto">
      <header className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900">設定</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 flex flex-col gap-4">
        {/* ファミリー情報 */}
        <section className="bg-white rounded-2xl px-5 py-4 shadow-sm flex flex-col gap-1">
          <p className="text-xs text-gray-400">ファミリー</p>
          <p className="text-base font-bold text-gray-900">{familyName}</p>
          <p className="text-sm text-gray-500">{memberName}としてログイン中</p>
        </section>

        {/* 参加メンバー */}
        <section className="bg-white rounded-2xl px-5 py-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700">参加メンバー</p>
            {members.length > 0 && (
              <button
                onClick={() => { setIsEditing((v) => !v); setConfirmDeleteId(null); setDeleteError(null) }}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition active:scale-95 ${
                  isEditing ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isEditing ? '完了' : '編集'}
              </button>
            )}
          </div>

          {deleteError && (
            <p className="text-xs text-red-500">{deleteError}</p>
          )}

          {members.length === 0 ? (
            <p className="text-sm text-gray-400">読み込み中...</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${getItemColor(m.display_name)}`}>
                    {m.display_name[0]}
                  </div>
                  <span className="flex-1 text-sm text-gray-800">{m.display_name}</span>
                  {m.id === memberId && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">あなた</span>
                  )}

                  {isEditing && (
                    confirmDeleteId === m.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDeleteMember(m.id)}
                          className="text-xs px-2.5 py-1 rounded-full bg-red-500 text-white font-semibold active:scale-95 transition"
                        >
                          削除
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-semibold active:scale-95 transition"
                        >
                          戻る
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(m.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-400 text-sm font-bold active:scale-95 transition"
                      >
                        ×
                      </button>
                    )
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 招待URL */}
        <section className="bg-white rounded-2xl px-5 py-4 shadow-sm flex flex-col gap-3">
          <p className="text-sm font-bold text-gray-700">家族を招待する</p>
          {inviteUrl ? (
            <>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 break-all">
                {inviteUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`w-full rounded-xl py-3 text-sm font-semibold transition active:scale-95 ${
                  copied ? 'bg-green-100 text-green-600' : 'bg-green-500 text-white'
                }`}
              >
                {copied ? 'コピーしました！' : 'URLをコピー'}
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-400">読み込み中...</p>
          )}
        </section>
      </main>
    </div>
  )
}
