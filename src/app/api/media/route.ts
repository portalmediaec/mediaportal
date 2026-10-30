import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { slugify, uniqueSlug, getMediaType, fileExtension, FREE_LIMIT_PER_CATEGORY, PRICE_PER_IMAGE } from '@/lib/helpers'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'

// ---------- GET: lista pública de media aprobado ----------
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const categoryId = sp.get('categoryId') || undefined
  const subcategoryId = sp.get('subcategoryId') || undefined
  const type = sp.get('type') || undefined
  const sort = sp.get('sort') || 'recent'
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
  const limit = Math.min(48, Math.max(1, parseInt(sp.get('limit') || '24', 10)))

  const where: Record<string, unknown> = { status: 'APPROVED' }
  if (categoryId) where.categoryId = categoryId
  if (subcategoryId) where.subcategoryId = subcategoryId
  if (type && ['IMAGE', 'GIF', 'VIDEO'].includes(type)) where.type = type

  const orderBy =
    sort === 'popular' ? { views: 'desc' as const } : sort === 'oldest' ? { createdAt: 'asc' as const } : { createdAt: 'desc' as const }

  const [total, items] = await Promise.all([
    db.media.count({ where }),
    db.media.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        subcategory: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, company: true } },
      },
    }),
  ])

  return NextResponse.json({ items, total, page, limit, pages: Math.ceil(total / limit) })
}

// ---------- Helper: guarda un archivo subido ----------
export async function saveFile(file: File): Promise<{ url: string; filename: string; size: number; ext: string }> {
  const ext = fileExtension(file.name) || 'bin'
  const buf = Buffer.from(await file.arrayBuffer())
  const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`
  const dir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, name), buf)
  return { url: `/uploads/${name}`, filename: name, size: buf.length, ext }
}

// ---------- Helper: presupuesto de subida ----------
export async function computeUploadBudget(userId: string, categoryId: string, incoming: number) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return { ok: false as const, error: 'Usuario no encontrado' }

  const existing = await db.media.count({ where: { userId, categoryId, status: { not: 'REJECTED' } } })
  const freeRemaining = Math.max(0, FREE_LIMIT_PER_CATEGORY - existing)
  const freeUsed = Math.min(incoming, freeRemaining)
  const paidUsed = incoming - freeUsed
  const creditsNeeded = paidUsed

  if (paidUsed > 0 && user.credits < creditsNeeded) {
    return {
      ok: false as const,
      error: `Necesitas ${creditsNeeded} crédito(s) para subir ${paidUsed} imagen(es) extra en esta categoría. Tienes ${user.credits}. Precio: $${PRICE_PER_IMAGE} por imagen.`,
      creditsNeeded,
      creditsAvailable: user.credits,
      freeRemaining,
    }
  }
  return { ok: true as const, freeUsed, paidUsed, creditsNeeded, creditsAvailable: user.credits, freeRemaining }
}

// ---------- POST: subir una sola media ----------
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })

  let categoryId: string
  let subcategoryId: string | undefined
  let title: string
  let description: string | undefined
  let externalLink: string | undefined
  let seoTitle: string | undefined
  let seoDescription: string | undefined
  let seoKeywords: string | undefined
  let tags: string | undefined
  let altText: string | undefined
  let url: string
  let type: string
  let thumbnailUrl: string | undefined
  let size: number | undefined

  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    const file = form.get('file') as File | null
    categoryId = String(form.get('categoryId') || '')
    subcategoryId = (form.get('subcategoryId') as string) || undefined
    title = String(form.get('title') || file?.name?.replace(/\.[^.]+$/, '') || 'Sin título')
    description = (form.get('description') as string) || undefined
    externalLink = (form.get('externalLink') as string) || undefined
    seoTitle = (form.get('seoTitle') as string) || undefined
    seoDescription = (form.get('seoDescription') as string) || undefined
    seoKeywords = (form.get('seoKeywords') as string) || undefined
    tags = (form.get('tags') as string) || undefined
    altText = (form.get('altText') as string) || undefined

    if (!file) return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 })
    if (!categoryId) return NextResponse.json({ error: 'Categoría requerida' }, { status: 400 })

    const budget = await computeUploadBudget(user.id, categoryId, 1)
    if (!budget.ok) return NextResponse.json({ error: budget.error, kind: 'credits' }, { status: 402 })

    const saved = await saveFile(file)
    url = saved.url
    type = getMediaType(file.name)
    size = saved.size
    if (budget.paidUsed > 0) {
      await db.user.update({ where: { id: user.id }, data: { credits: { decrement: budget.paidUsed } } })
    }
  } else {
    const body = await req.json()
    categoryId = body.categoryId
    subcategoryId = body.subcategoryId || undefined
    title = String(body.title || '')
    description = body.description || undefined
    externalLink = body.externalLink || undefined
    seoTitle = body.seoTitle || undefined
    seoDescription = body.seoDescription || undefined
    seoKeywords = body.seoKeywords || undefined
    tags = body.tags || undefined
    altText = body.altText || undefined
    url = String(body.url || '')
    type = body.type || getMediaType(url)
    thumbnailUrl = body.thumbnailUrl || undefined

    if (!categoryId) return NextResponse.json({ error: 'Categoría requerida' }, { status: 400 })
    if (!title) return NextResponse.json({ error: 'Título requerido' }, { status: 400 })
    if (!url) return NextResponse.json({ error: 'URL o archivo requerido' }, { status: 400 })

    const budget = await computeUploadBudget(user.id, categoryId, 1)
    if (!budget.ok) return NextResponse.json({ error: budget.error, kind: 'credits' }, { status: 402 })
    if (budget.paidUsed > 0) {
      await db.user.update({ where: { id: user.id }, data: { credits: { decrement: budget.paidUsed } } })
    }
  }

  const slug = uniqueSlug(slugify(title))
  const media = await db.media.create({
    data: {
      title,
      slug,
      description: description || null,
      url,
      thumbnailUrl: thumbnailUrl || null,
      type,
      externalLink: externalLink || null,
      altText: altText || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null,
      tags: tags || null,
      categoryId,
      subcategoryId: subcategoryId || null,
      userId: user.id,
      size,
      status: 'APPROVED',
    },
  })

  return NextResponse.json({ media })
}
