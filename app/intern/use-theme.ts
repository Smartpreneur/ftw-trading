'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'ftw_intern_theme'

export function useTheme() {
  const [light, setLight] = useState(false)

  useEffect(() => {
    setLight(localStorage.getItem(STORAGE_KEY) === 'light')
  }, [])

  const toggle = () => {
    const next = !light
    setLight(next)
    localStorage.setItem(STORAGE_KEY, next ? 'light' : 'dark')
  }

  return { light, toggle }
}
