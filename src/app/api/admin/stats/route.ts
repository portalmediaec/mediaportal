import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const [users, media, categories, payments, pending, revenueAgg] = await Promise.all([
    db.user.count(),
    db.media.count({ where: { status: 'APPROVED' } }),
    db.category.count({ where: { parentId: null } }),
    db.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { email: true, name: true } } } }),
    db.media.count({ where: { status: 'PENDING' } }),
    db.payment.aggregate({ _sum: { amount: true }, _sum: { imagesCount: true } }),
  ])

  const recentMedia = await db.media.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: {
      category: { select: { name: true } },
      user: { select: { email: true, name: true } },
    },
  })

  // media por categoría (top 8)
  const topCategories = await db.media.groupBy({
    by: ['categoryId'],
    where: { status: 'APPROVED' },
    _count: true,
    orderBy: { _count: { categoryId: 'desc' } },
    take: 8,
  })
  const cats = await db.category.findMany({ where: { id: { in: topCategories.map((t) => t.categoryId) } } })
  const catMap = new Map(cats.map((c) => [c.id, c.name]))
  const categoryStats = topCategories.map((t) => ({ name: catMap.get(t.categoryId) || '—', count: t._count }))

  return NextResponse.json({
    stats: {
      users,
      media,
      categories,
      pending,
      revenue: revenueAgg._sum.amount || 0,
      imagesSold: revenueAgg._sum.imagesCount || 0,
    },
    recentMedia,
    payments,
    categoryStats,
  })
}
