import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireAdmin } from '@/lib/auth'
import { slugify, uniqueSlug } from '@/lib/helpers'

// Lista pública de categorías (con conteo de media aprobado)
export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search') || ''
  const parents = await db.category.findMany({
    where: {
      parentId: null,
      ...(search ? { name: { contains: search } } : {}),
    },
    orderBy: { name: 'asc' },
  })

  const children = await db.category.findMany({
    where: { parentId: { not: null } },
    orderBy: { name: 'asc' },
  })

  // Conteos
  const allCats = [...parents, ...children]
  const counts = await Promise.all(
    allCats.map((c) => db.media.count({ where: { categoryId: c.id, status: 'APPROVED' } }))
  )
  const countMap = new Map<string, number>()
  allCats.forEach((c, i) => countMap.set(c.id, counts[i]))

  const build = (list: typeof parents, pid: string | null) =>
    list
      .filter((c) => c.parentId === pid)
      .map((c) => ({
        ...c,
        mediaCount: countMap.get(c.id) || 0,
        children: build(children as typeof parents, c.id),
      }))

  const tree = build(parents, null)
  return NextResponse.json({ categories: tree })
}

// Crear categoría (solo admin)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })

  const slug = uniqueSlug(slugify(name))
  const category = await db.category.create({
    data: {
      name,
      slug,
      description: body.description ? String(body.description) : null,
      icon: body.icon ? String(body.icon) : null,
      color: body.color ? String(body.color) : null,
      parentId: body.parentId ? String(body.parentId) : null,
    },
  })
  return NextResponse.json({ category })
}

// Actualizar categoría (solo admin) - usando query param id
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = String(body.name)
  if (body.description !== undefined) data.description = body.description ? String(body.description) : null
  if (body.icon !== undefined) data.icon = body.icon ? String(body.icon) : null
  if (body.color !== undefined) data.color = body.color ? String(body.color) : null
  if (body.parentId !== undefined) data.parentId = body.parentId ? String(body.parentId) : null

  const category = await db.category.update({ where: { id }, data })
  return NextResponse.json({ category })
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  await db.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
