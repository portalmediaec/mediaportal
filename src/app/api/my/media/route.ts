import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const search = req.nextUrl.searchParams.get('search') || ''
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '12', 10)))

  const where: Record<string, unknown> = { userId: user.id }
  if (search) where.OR = [{ title: { contains: search } }, { tags: { contains: search } }]

  const [total, items] = await Promise.all([
    db.media.count({ where }),
    db.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        subcategory: { select: { id: true, name: true } },
      },
    }),
  ])

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) })
}
