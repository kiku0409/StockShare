'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

export function usePushNotification(familyId: string | null, memberId: string | null) {
  useEffect(() => {
    if (!familyId || !memberId) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })

        await supabase.from('push_subscriptions').delete().eq('member_id', memberId)
        await supabase.from('push_subscriptions').insert({
          member_id: memberId,
          family_id: familyId,
          subscription: subscription.toJSON(),
        })
      } catch (err) {
        console.error('push registration failed:', err)
      }
    }

    register()
  }, [familyId, memberId])
}
