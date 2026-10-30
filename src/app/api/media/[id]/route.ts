import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { FREE_LIMIT_PER_CATEGORY } from '@/lib/helpers'

type Params = { params: Promise<{ id: string }> }

// GET detalle público + suma vista
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const media = await db.media.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true, description: true } },
      subcategory: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, company: true, website: true } },
    },
  })
  if (!media || media.status !== 'APPROVED') {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
  // incrementar vistas en background (sin await para no bloquear)
  db.media.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {})

  // relacionadas (misma categoría)
  const related = await db.media.findMany({
    where: { categoryId: media.categoryId, status: 'APPROVED', id: { not: id } },
    take: 8,
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, slug: true, url: true, thumbnailUrl: true, type: true },
  })

  return NextResponse.json({ media, related })
}

// PUT actualizar (propietario o admin)
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const media = await db.media.findUnique({ where: { id } })
  if (!media) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (media.userId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 })
  }

  const body = await req.json()
  const data: Record<string, unknown> = {}
  for (const key of ['title', 'description', 'externalLink', 'altText', 'seoTitle', 'seoDescription', 'seoKeywords', 'tags', 'url', 'thumbnailUrl', 'type', 'subcategoryId', 'status']) {
    if (body[key] !== undefined) data[key] = body[key] === '' ? null : body[key]
  }
  if (body.categoryId !== undefined) data.categoryId = String(body.categoryId)

  const updated = await db.media.update({ where: { id }, data })
  return NextResponse.json({ media: updated })
}

// DELETE (propietario o admin) - reembolsa crédito si era slot de pago
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const media = await db.media.findUnique({ where: { id } })
  if (!media) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (media.userId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 })
  }

  // si el usuario tiene más de FREE_LIMIT imágenes en esta categoría, esta era slot de pago -> reembolsar
  const count = await db.media.count({ where: { userId: media.userId, categoryId: media.categoryId, status: { not: 'REJECTED' } } })
  if (count > FREE_LIMIT_PER_CATEGORY) {
    await db.user.update({ where: { id: media.userId }, data: { credits: { increment: 1 } } })
  }

  await db.media.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
