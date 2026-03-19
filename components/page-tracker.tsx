'use client'

import { useEffect, useRef } from 'react'
import { trackPageView } from '@/lib/actions'

const SESSION_KEY = 'ftw_session_id'

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function PageTracker({ path }: { path: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    const sessionId = getSessionId()
    const referrer = document.referrer || null
    trackPageView(path, referrer, sessionId)
  }, [path])

  return null
}
