import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { PRICE_PER_IMAGE } from '@/lib/helpers'

// GET: historial de pagos del usuario
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const payments = await db.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ payments, credits: user.credits })
}

// POST: comprar créditos (simulado). body: { imagesCount }
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const imagesCount = Math.max(1, Math.min(1000, parseInt(body.imagesCount, 10) || 1))
  const amount = Math.round(imagesCount * PRICE_PER_IMAGE * 100) / 100

  // Pago simulado: se aprueba automáticamente
  const payment = await db.payment.create({
    data: {
      userId: user.id,
      amount,
      imagesCount,
      status: 'PAID',
      method: 'SIMULATED',
    },
  })

  await db.user.update({ where: { id: user.id }, data: { credits: { increment: imagesCount } } })

  const updated = await db.user.findUnique({ where: { id: user.id }, select: { credits: true } })

  return NextResponse.json({ payment, credits: updated?.credits ?? 0 })
}
