import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { slugify, uniqueSlug, getMediaType, FREE_LIMIT_PER_CATEGORY, PRICE_PER_IMAGE } from '@/lib/helpers'
import { saveFile, computeUploadBudget } from '@/lib/media-helpers'

// POST: subida masiva de archivos
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })

  const form = await req.formData()
  const categoryId = String(form.get('categoryId') || '')
  if (!categoryId) return NextResponse.json({ error: 'Categoría requerida' }, { status: 400 })

  const subcategoryId = (form.get('subcategoryId') as string) || undefined
  const commonDescription = (form.get('description') as string) || undefined
  const commonExternalLink = (form.get('externalLink') as string) || undefined
  const commonSeoKeywords = (form.get('seoKeywords') as string) || undefined
  const commonTags = (form.get('tags') as string) || undefined

  const files = form.getAll('files').filter((f): f is File => typeof File !== 'undefined' && f instanceof File)
  if (files.length === 0) return NextResponse.json({ error: 'No se encontraron archivos' }, { status: 400 })

  const budget = await computeUploadBudget(user.id, categoryId, files.length)
  if (!budget.ok) {
    return NextResponse.json(
      {
        error: budget.error,
        kind: 'credits',
        freeRemaining: budget.freeRemaining,
        creditsAvailable: budget.creditsAvailable,
        creditsNeeded: budget.creditsNeeded,
        pricePerImage: PRICE_PER_IMAGE,
      },
      { status: 402 }
    )
  }

  const created = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const saved = await saveFile(file)
    const title = file.name.replace(/\.[^.]+$/, '')
    const slug = uniqueSlug(slugify(title))
    const media = await db.media.create({
      data: {
        title,
        slug,
        description: commonDescription || null,
        url: saved.url,
        type: getMediaType(file.name),
        externalLink: commonExternalLink || null,
        altText: title,
        seoKeywords: commonSeoKeywords || null,
        tags: commonTags || null,
        categoryId,
        subcategoryId: subcategoryId || null,
        userId: user.id,
        size: saved.size,
        status: 'APPROVED',
      },
    })
    created.push(media)
  }

  if (budget.paidUsed > 0) {
    await db.user.update({ where: { id: user.id }, data: { credits: { decrement: budget.paidUsed } } })
  }

  const updatedUser = await db.user.findUnique({ where: { id: user.id }, select: { credits: true } })

  return NextResponse.json({
    uploaded: created.length,
    media: created,
    freeUsed: budget.freeUsed,
    paidUsed: budget.paidUsed,
    credits: updatedUser?.credits ?? 0,
    message:
      budget.paidUsed > 0
        ? `${created.length} imagen(es) subida(s). ${budget.freeUsed} gratis y ${budget.paidUsed} pagada(s) ($${(budget.paidUsed * PRICE_PER_IMAGE).toFixed(2)}).`
        : `${created.length} imagen(es) subida(s) de forma gratuita.`,
  })
}

// GET: presupuesto disponible (gratis restantes + créditos) para una categoría
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const categoryId = req.nextUrl.searchParams.get('categoryId')
  if (!categoryId) return NextResponse.json({ error: 'Categoría requerida' }, { status: 400 })
  const budget = await computeUploadBudget(user.id, categoryId, 0)
  if (!budget.ok) return NextResponse.json({ error: budget.error }, { status: 400 })
  return NextResponse.json({
    freeRemaining: budget.freeRemaining,
    creditsAvailable: budget.creditsAvailable,
    freeLimitPerCategory: FREE_LIMIT_PER_CATEGORY,
    pricePerImage: PRICE_PER_IMAGE,
  })
}
