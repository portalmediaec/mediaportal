import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createPaypalOrder, paypalEnabled } from '@/lib/paypal'
import { PRICE_PER_IMAGE } from '@/lib/helpers'

// Crea una orden de PayPal para comprar N créditos
export async function POST(req: NextRequest) {
  if (!paypalEnabled()) {
    return NextResponse.json({ error: 'PayPal no está configurado. Añade PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET al .env' }, { status: 503 })
  }
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const imagesCount = Math.max(1, Math.min(1000, parseInt(body.imagesCount, 10) || 1))
  const amount = Math.round(imagesCount * PRICE_PER_IMAGE * 100) / 100

  try {
    const order = await createPaypalOrder({
      amount,
      imagesCount,
      userId: user.id,
      description: `${imagesCount} créditos de imagen en MediaPortal ($${amount.toFixed(2)} USD)`,
    })
    return NextResponse.json({ orderID: order.id, status: order.status, amount, imagesCount })
  } catch (e) {
    console.error('paypal create order', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
