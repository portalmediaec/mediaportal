import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, signToken, SESSION_COOKIE, tokenMaxAge } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body.email || '').toLowerCase().trim()
    const password = String(body.password || '')
    const name = String(body.name || '').trim()
    const company = body.company ? String(body.company).trim() : null
    const website = body.website ? String(body.website).trim() : null

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este email' }, { status: 409 })
    }

    // El primer usuario creado será admin automáticamente
    const userCount = await db.user.count()
    const role = userCount === 0 ? 'ADMIN' : 'USER'

    const user = await db.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash: hashPassword(password),
        role,
        company,
        website,
        credits: 0,
      },
    })

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
    console.error('register error', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
