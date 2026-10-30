import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim()
  const type = req.nextUrl.searchParams.get('type') || undefined
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10))
  const limit = Math.min(48, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '24', 10)))

  if (!q) {
    return NextResponse.json({ items: [], total: 0, page, pages: 0, q })
  }

  const where: Record<string, unknown> = {
    status: 'APPROVED',
    OR: [
      { title: { contains: q } },
      { description: { contains: q } },
      { tags: { contains: q } },
      { seoKeywords: { contains: q } },
      { seoDescription: { contains: q } },
    ],
  }
  if (type && ['IMAGE', 'GIF', 'VIDEO'].includes(type)) where.type = type

  const [total, items] = await Promise.all([
    db.media.count({ where }),
    db.media.findMany({
      where,
      orderBy: { views: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        subcategory: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, company: true } },
      },
    }),
  ])

  // sugerencias de categorías coincidentes
  const categories = await db.category.findMany({
    where: { OR: [{ name: { contains: q } }, { description: { contains: q } }] },
    take: 5,
  })

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit), q, categories })
}
