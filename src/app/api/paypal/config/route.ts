import { NextResponse } from 'next/server'
import { paypalEnabled, paypalClientId } from '@/lib/paypal'

// Devuelve la configuración pública de PayPal para el frontend
export async function GET() {
  return NextResponse.json({
    enabled: paypalEnabled(),
    clientId: paypalClientId(),
  })
}
