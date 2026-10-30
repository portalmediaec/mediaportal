'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2, CreditCard, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        style?: { layout?: string; color?: string; shape?: string; label?: string; height?: number }
        createOrder: () => Promise<string>
        onApprove: (data: { orderID: string }) => Promise<void>
        onError: (err: unknown) => void
      }) => { render: (el: HTMLElement) => Promise<void> }
    }
  }
}

const SCRIPT_SRC_BY_CLIENT: Record<string, string> = {}

function loadScript(src: string): Promise<void> {
  if (SCRIPT_SRC_BY_CLIENT[src]) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const el = document.getElementById('paypal-sdk') as HTMLScriptElement | null
    if (el) {
      el.addEventListener('load', () => resolve())
      el.addEventListener('error', () => reject(new Error('No se pudo cargar el SDK de PayPal')))
      return
    }
    const script = document.createElement('script')
    script.id = 'paypal-sdk'
    script.src = src
    script.async = true
    script.onload = () => {
      SCRIPT_SRC_BY_CLIENT[src] = 'loaded'
      resolve()
    }
    script.onerror = () => reject(new Error('No se pudo cargar el SDK de PayPal'))
    document.head.appendChild(script)
  })
}

export function PayPalButton({
  imagesCount,
  amount,
  disabled,
  onSuccess,
}: {
  imagesCount: number
  amount: number
  disabled?: boolean
  onSuccess: (credits: number, imagesCount: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [config, setConfig] = useState<{ enabled: boolean; clientId: string } | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [loadingSdk, setLoadingSdk] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const c = await api.paypalConfig()
        if (active) setConfig(c)
      } catch {
        if (active) setConfig({ enabled: false, clientId: '' })
      } finally {
        if (active) setLoadingConfig(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!config?.enabled || !config.clientId || !containerRef.current) return
    if (disabled) return
    let cancelled = false
    ;(async () => {
      setLoadingSdk(true)
      try {
        const src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.clientId)}&currency=USD&intent=capture`
        await loadScript(src)
        if (cancelled || !window.paypal || !containerRef.current) return
        // limpiar contenedor antes de renderizar
        containerRef.current.innerHTML = ''
        window.paypal
          .Buttons({
            style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay', height: 45 },
            createOrder: async () => {
              const res = await api.paypalCreateOrder(imagesCount)
              return res.orderID
            },
            onApprove: async (data) => {
              setProcessing(true)
              try {
                const res = await api.paypalCaptureOrder(data.orderID)
                toast.success(`Pago completado: +${res.imagesCount} créditos`)
                onSuccess(res.credits, res.imagesCount)
              } catch (e) {
                toast.error((e as Error).message)
              } finally {
                setProcessing(false)
              }
            },
            onError: (err) => {
              console.error('paypal error', err)
              toast.error('Hubo un error procesando el pago con PayPal')
              setProcessing(false)
            },
          })
          .render(containerRef.current)
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoadingSdk(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [config, imagesCount, disabled, onSuccess])

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verificando PayPal…
      </div>
    )
  }

  if (!config?.enabled) {
    return (
      <Card className="p-4 border-dashed bg-muted/30">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium">PayPal no configurado todavía</p>
            <p className="text-muted-foreground text-xs mt-1">
              Para activar pagos reales con PayPal, añade tus credenciales en el archivo{' '}
              <code className="rounded bg-muted px-1 py-0.5">.env</code>:
            </p>
            <pre className="mt-2 rounded bg-muted/80 p-2 text-[10px] overflow-x-auto">
{`PAYPAL_CLIENT_ID=tu_client_id
PAYPAL_CLIENT_SECRET=tu_secret
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com`}
            </pre>
            <p className="text-muted-foreground text-xs mt-2">
              Mientras tanto, puedes usar el <strong>modo demo</strong> (pago simulado) para probar el flujo.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5" /> Pagar con PayPal
        </span>
        <Badge variant="secondary">${amount.toFixed(2)} USD</Badge>
      </div>
      <div ref={containerRef} className="min-h-[45px]">
        {loadingSdk && (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cargando PayPal…
          </div>
        )}
        {processing && (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando pago…
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
