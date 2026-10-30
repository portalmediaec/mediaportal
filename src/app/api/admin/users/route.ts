import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const search = req.nextUrl.searchParams.get('search') || ''
  const users = await db.user.findMany({
    where: search ? { OR: [{ email: { contains: search } }, { name: { contains: search } }] } : {},
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      credits: true,
      company: true,
      createdAt: true,
      _count: { select: { media: true, payments: true } },
    },
  })
  return NextResponse.json({ users })
}

// PATCH: actualizar rol / créditos
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const id = String(body.id || '')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (body.role === 'ADMIN' || body.role === 'USER') data.role = body.role
  if (typeof body.credits === 'number') data.credits = Math.max(0, body.credits)
  if (body.name !== undefined) data.name = body.name

  const user = await db.user.update({ where: { id }, data, select: { id: true, email: true, name: true, role: true, credits: true } })
  return NextResponse.json({ user })
}

// DELETE: eliminar usuario
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  if (id === admin.id) return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })

  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
