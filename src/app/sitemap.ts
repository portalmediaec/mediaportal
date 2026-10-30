import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://mediaportal.example.com'
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]

  try {
    const categories = await db.category.findMany({ select: { id: true, name: true, updatedAt: true }, where: { parentId: null } })
    for (const c of categories) {
      entries.push({
        url: `${baseUrl}/#/category/${c.id}`,
        lastModified: c.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }

    const media = await db.media.findMany({ where: { status: 'APPROVED' }, select: { id: true, createdAt: true }, take: 500, orderBy: { createdAt: 'desc' } })
    for (const m of media) {
      entries.push({
        url: `${baseUrl}/#/media/${m.id}`,
        lastModified: m.createdAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  } catch {
    // ignore db errors in sitemap
  }

  return entries
}
