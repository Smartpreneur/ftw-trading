'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'ftw_intern_theme'

export function useTheme() {
  const [light, setLight] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    setLight(stored === null ? true : stored === 'light')
  }, [])

  const toggle = () => {
    const next = !light
    setLight(next)
    localStorage.setItem(STORAGE_KEY, next ? 'light' : 'dark')
  }

  return { light, toggle }
}
