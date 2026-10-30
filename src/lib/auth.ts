import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { db } from './db'

const COOKIE_NAME = 'mp_session'
const SECRET = process.env.AUTH_SECRET || 'media-portal-dev-secret-change-me-9f3k2'

// ---------- Password hashing (scrypt) ----------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':')
  if (!salt || !key) return false
  const hashBuf = Buffer.from(scryptSync(password, salt, 64))
  const keyBuf = Buffer.from(key, 'hex')
  if (hashBuf.length !== keyBuf.length) return false
  return timingSafeEqual(hashBuf, keyBuf)
}

// ---------- JWT (HMAC SHA256) ----------
function base64UrlEncode(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(str: string): string {
  let s = str.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return Buffer.from(s, 'base64').toString('utf8')
}

export function signToken(payload: Record<string, unknown>): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64UrlEncode(header)
  const encodedPayload = base64UrlEncode({ ...payload, iat: Math.floor(Date.now() / 1000) })
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = createHmac('sha256', SECRET).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${data}.${signature}`
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [encodedHeader, encodedPayload, signature] = parts
    const data = `${encodedHeader}.${encodedPayload}`
    const expected = createHmac('sha256', SECRET).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    if (signature !== expected) return null
    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return { userId: payload.userId, role: payload.role }
  } catch {
    return null
  }
}

// ---------- Session helpers ----------
export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, credits: true, company: true, website: true },
  })
  return user
}

export async function requireUser() {
  const user = await getSession()
  if (!user) return null
  return user
}

export async function requireAdmin() {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return null
  return user
}

export const SESSION_COOKIE = COOKIE_NAME

export function tokenMaxAge() {
  return 60 * 60 * 24 * 7 // 7 días
}
