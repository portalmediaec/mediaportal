import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { FREE_LIMIT_PER_CATEGORY, PRICE_PER_IMAGE } from '@/lib/helpers'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [totalMedia, approved, pending, rejected, media, payments] = await Promise.all([
    db.media.count({ where: { userId: user.id } }),
    db.media.count({ where: { userId: user.id, status: 'APPROVED' } }),
    db.media.count({ where: { userId: user.id, status: 'PENDING' } }),
    db.media.count({ where: { userId: user.id, status: 'REJECTED' } }),
    db.media.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, title: true, url: true, thumbnailUrl: true, type: true, status: true, views: true, createdAt: true, categoryId: true },
    }),
    db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  const totalViews = await db.media.aggregate({ where: { userId: user.id }, _sum: { views: true } })
  const spent = await db.payment.aggregate({ where: { userId: user.id, status: 'PAID' }, _sum: { amount: true } })

  // uso por categoría
  const byCat = await db.media.groupBy({
    by: ['categoryId'],
    where: { userId: user.id, status: { not: 'REJECTED' } },
    _count: true,
  })
  const cats = await db.category.findMany({ where: { id: { in: byCat.map((b) => b.categoryId) } } })
  const catMap = new Map(cats.map((c) => [c.id, c.name]))
  const usageByCategory = byCat.map((b) => ({
    categoryId: b.categoryId,
    name: catMap.get(b.categoryId) || '—',
    count: b._count,
    freeUsed: Math.min(b._count, FREE_LIMIT_PER_CATEGORY),
    paidUsed: Math.max(0, b._count - FREE_LIMIT_PER_CATEGORY),
    freeLimit: FREE_LIMIT_PER_CATEGORY,
  }))

  return NextResponse.json({
    stats: {
      totalMedia,
      approved,
      pending,
      rejected,
      totalViews: totalViews._sum.views || 0,
      credits: user.credits,
      spent: spent._sum.amount || 0,
      imagesPurchased: payments.reduce((a, p) => a + p.imagesCount, 0),
    },
    recentMedia: media,
    usageByCategory,
    payments,
    pricePerImage: PRICE_PER_IMAGE,
    freeLimitPerCategory: FREE_LIMIT_PER_CATEGORY,
  })
}
