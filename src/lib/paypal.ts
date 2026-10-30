// PayPal REST API helpers
// Documentación: https://developer.paypal.com/api/rest/
//
// Variables de entorno requeridas (en .env):
//   PAYPAL_CLIENT_ID     - Client ID de la app de PayPal
//   PAYPAL_CLIENT_SECRET - Secret de la app de PayPal
//   PAYPAL_API_BASE     - https://api-m.sandbox.paypal.com (sandbox) o https://api-m.paypal.com (live)
//   PAYPAL_WEB_URL      - https://www.sandbox.paypal.com (sandbox) o https://www.paypal.com (live)
//   NEXT_PUBLIC_PAYPAL_CLIENT_ID - el mismo client id, accesible desde el navegador para cargar el SDK

let cachedToken: { token: string; expiresAt: number } | null = null

export function paypalEnabled(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID &&
      process.env.PAYPAL_CLIENT_SECRET &&
      process.env.PAYPAL_API_BASE
  )
}

export function paypalApiBase(): string {
  return process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com'
}

export function paypalWebUrl(): string {
  return process.env.PAYPAL_WEB_URL || 'https://www.sandbox.paypal.com'
}

export function paypalClientId(): string {
  return process.env.PAYPAL_CLIENT_ID || ''
}

// Obtiene (y cachea) el access token OAuth2 de PayPal
export async function getAccessToken(): Promise<string> {
  if (!paypalEnabled()) throw new Error('PayPal no está configurado')
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token
  }
  const creds = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal auth failed: ${res.status} ${text}`)
  }
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return cachedToken.token
}

// Crea una orden de PayPal por un monto en USD
export async function createPaypalOrder(params: {
  amount: number
  imagesCount: number
  userId: string
  description: string
}): Promise<{ id: string; status: string }> {
  const token = await getAccessToken()
  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: params.amount.toFixed(2),
        },
        description: params.description,
        custom_id: `${params.userId}:${params.imagesCount}`,
      },
    ],
    application_context: {
      brand_name: 'MediaPortal',
      user_action: 'PAY_NOW',
      shipping_preference: 'NO_SHIPPING',
    },
  }
  const res = await fetch(`${paypalApiBase()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal create order failed: ${res.status} ${text}`)
  }
  const data = (await res.json()) as { id: string; status: string }
  return { id: data.id, status: data.status }
}

// Captura una orden aprobada por el usuario
export async function capturePaypalOrder(orderId: string): Promise<{
  status: string
  customId: string | null
  amount: number | null
  payerEmail: string | null
}> {
  const token = await getAccessToken()
  const res = await fetch(`${paypalApiBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal capture failed: ${res.status} ${text}`)
  }
  const data = (await res.json()) as {
    status: string
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{
          status: string
          amount?: { value: string }
          custom_id?: string
        }>
      }
    }>
    payer?: { email_address?: string }
  }
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0]
  return {
    status: capture?.status || data.status,
    customId: capture?.custom_id || null,
    amount: capture?.amount?.value ? parseFloat(capture.amount.value) : null,
    payerEmail: data.payer?.email_address || null,
  }
}
