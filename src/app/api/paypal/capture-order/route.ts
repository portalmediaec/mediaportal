import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { capturePaypalOrder, paypalEnabled } from '@/lib/paypal'

// Captura el pago de PayPal tras la aprobación del usuario y acredita los créditos
export async function POST(req: NextRequest) {
  if (!paypalEnabled()) {
    return NextResponse.json({ error: 'PayPal no está configurado' }, { status: 503 })
  }
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const orderID = String(body.orderID || '')
  if (!orderID) return NextResponse.json({ error: 'orderID requerido' }, { status: 400 })

  try {
    const capture = await capturePaypalOrder(orderID)
    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ error: `Pago no completado: ${capture.status}` }, { status: 400 })
    }

    // custom_id = userId:imagesCount
    let imagesCount = 0
    let paidUserId = user.id
    if (capture.customId) {
      const [uid, count] = capture.customId.split(':')
      if (uid) paidUserId = uid
      if (count) imagesCount = parseInt(count, 10) || 0
    }
    // fallback si customId no vino
    if (!imagesCount && capture.amount) {
      imagesCount = Math.round(capture.amount / 0.1)
    }
    if (imagesCount < 1) {
      return NextResponse.json({ error: 'No se pudo determinar la cantidad de créditos' }, { status: 400 })
    }

    // Idempotencia: si ya existe un pago con este orderID, no duplicar
    const existing = await db.payment.findFirst({ where: { method: `PAYPAL:${orderID}` } })
    if (existing) {
      const refreshed = await db.user.findUnique({ where: { id: user.id }, select: { credits: true } })
      return NextResponse.json({ ok: true, credits: refreshed?.credits ?? 0, alreadyProcessed: true })
    }

    const payment = await db.payment.create({
      data: {
        userId: paidUserId,
        amount: capture.amount || imagesCount * 0.1,
        imagesCount,
        status: 'PAID',
        method: `PAYPAL:${orderID}`,
      },
    })
    await db.user.update({ where: { id: paidUserId }, data: { credits: { increment: imagesCount } } })

    const updated = await db.user.findUnique({ where: { id: paidUserId }, select: { credits: true } })
    return NextResponse.json({ ok: true, payment, credits: updated?.credits ?? 0, imagesCount })
  } catch (e) {
    console.error('paypal capture', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
