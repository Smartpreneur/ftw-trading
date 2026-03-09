import { useEffect, useState } from 'react'

const KEY = 'intern-dev'

export function useDevMode(): boolean {
  const [dev, setDev] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('dev')) {
      sessionStorage.setItem(KEY, '1')
      setDev(true)
    } else if (sessionStorage.getItem(KEY) === '1') {
      setDev(true)
    }
  }, [])

  return dev
}
