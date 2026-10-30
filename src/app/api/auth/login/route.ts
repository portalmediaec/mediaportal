import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, signToken, SESSION_COOKIE, tokenMaxAge } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body.email || '').toLowerCase().trim()
    const password = String(body.password || '')

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const token = signToken({ userId: user.id, role: user.role })
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, credits: user.credits, company: user.company, website: user.website },
    })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: tokenMaxAge(),
      path: '/',
    })
    return res
  } catch (e) {
    console.error('login error', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
