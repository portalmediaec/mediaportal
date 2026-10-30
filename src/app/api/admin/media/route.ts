import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET: todo el media (con filtros por status y búsqueda)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const status = req.nextUrl.searchParams.get('status') || undefined
  const search = req.nextUrl.searchParams.get('search') || undefined
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '20', 10)))

  const where: Record<string, unknown> = {}
  if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) where.status = status
  if (search) where.OR = [{ title: { contains: search } }, { description: { contains: search } }]

  const [total, items] = await Promise.all([
    db.media.count({ where }),
    db.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { name: true } },
        user: { select: { email: true, name: true } },
      },
    }),
  ])

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) })
}

// PATCH: moderar media (aprobar/rechazar)
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const id = String(body.id || '')
  const status = body.status
  if (!id || !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const media = await db.media.update({ where: { id }, data: { status } })
  return NextResponse.json({ media })
}
