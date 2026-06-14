'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { storage } from '@/lib/storage'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    if (storage.isLoggedIn()) {
      router.replace('/home')
    } else {
      router.replace('/onboarding/family')
    }
  }, [router])

  return null
}
