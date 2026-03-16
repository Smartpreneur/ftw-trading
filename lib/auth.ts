'use server'

import { cookies } from 'next/headers'

const COOKIE_NAME = 'ftw_auth'
const TOKEN_VALUE = 'authenticated'

const ADMIN_COOKIE = 'ftw_admin'
const ADMIN_TOKEN = 'admin_authenticated'

export async function authenticate(password: string) {
  if (password !== process.env.INTERN_PASSWORD) {
    return { error: 'Falsches Passwort' }
  }

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, TOKEN_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return { success: true }
}

export async function checkAuth(embedToken?: string): Promise<boolean> {
  // Dev mode: if no INTERN_PASSWORD is configured, allow through
  if (!process.env.INTERN_PASSWORD) return true
  // iFrame embed: accept static token from URL param
  // Vercel env vars may contain literal "\n" suffix — strip it along with whitespace
  if (embedToken && process.env.EMBED_TOKEN) {
    const clean = (s: string) => s.replace(/\\n$/, '').trim()
    if (clean(embedToken) === clean(process.env.EMBED_TOKEN)) return true
  }
  const cookieStore = await cookies()
  // Admin is always authed
  if (cookieStore.get(ADMIN_COOKIE)?.value === ADMIN_TOKEN) return true
  return cookieStore.get(COOKIE_NAME)?.value === TOKEN_VALUE
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Admin auth
export async function authenticateAdmin(password: string, rememberMe = false) {
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: 'Falsches Passwort' }
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE, ADMIN_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: rememberMe ? 60 * 60 * 24 * 90 : 60 * 60 * 24 * 7, // 90 days or 7 days
    path: '/',
  })

  return { success: true }
}

export async function checkAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(ADMIN_COOKIE)?.value === ADMIN_TOKEN
}

export async function logoutAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE)
}
