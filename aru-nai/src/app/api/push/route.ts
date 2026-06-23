import { NextRequest, NextResponse } from 'next/server'
import webPush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
)

const vapidConfigured =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT

if (vapidConfigured) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

export async function POST(req: NextRequest) {
  if (!vapidConfigured) return NextResponse.json({ sent: 0, reason: 'vapid not configured' })

  const { family_id, title, body, exclude_member_id } = await req.json()
  if (!family_id) return NextResponse.json({ error: 'missing family_id' }, { status: 400 })

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, subscription, member_id')
    .eq('family_id', family_id)

  if (!subscriptions?.length) return NextResponse.json({ sent: 0 })

  const payload = JSON.stringify({ title, body })
  let sent = 0

  await Promise.all(
    subscriptions
      .filter((s) => s.member_id !== exclude_member_id)
      .map(async (s) => {
        try {
          await webPush.sendNotification(s.subscription, payload)
          sent++
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode
          if (status === 410 || status === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', s.id)
          }
        }
      })
  )

  return NextResponse.json({ sent })
}
