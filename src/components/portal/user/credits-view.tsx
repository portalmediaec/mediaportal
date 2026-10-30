'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp, type Route } from '@/stores/app-store'
import { api } from '@/lib/api'
import { BackofficeLayout } from '../backoffice-layout'
import { Seo } from '../seo'
import { PayPalButton } from '../paypal-button'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { LayoutDashboard, ImagePlus, FolderOpen, Wallet, CreditCard, CheckCircle2, Receipt, Zap } from 'lucide-react'

const NAV: { label: string; route: Route; icon: React.ReactNode }[] = [
  { label: 'Panel', route: { name: 'dashboard' }, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Subir imágenes', route: { name: 'upload' }, icon: <ImagePlus className="h-4 w-4" /> },
  { label: 'Mis imágenes', route: { name: 'my-media' }, icon: <FolderOpen className="h-4 w-4" /> },
  { label: 'Comprar créditos', route: { name: 'credits' }, icon: <Wallet className="h-4 w-4" /> },
]

const PRICE = 0.1
const PACKS = [10, 25, 50, 100, 250]

export function CreditsView() {
  const { user, navigate, refreshUser } = useApp()
  const [quantity, setQuantity] = useState(10)
  const [buying, setBuying] = useState<number | null>(null)
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [paypalEnabled, setPaypalEnabled] = useState(false)

  const loadPayments = useCallback(async () => {
    try {
      const res = await api.payments()
      setPayments(res.payments)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!user) {
      navigate({ name: 'login' })
      return
    }
    let active = true
    ;(async () => {
      try {
        const [pay, cfg] = await Promise.all([api.payments(), api.paypalConfig()])
        if (!active) return
        setPayments(pay.payments)
        setPaypalEnabled(cfg.enabled)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [user, navigate])

  const purchaseDemo = async (n: number) => {
    setBuying(n)
    try {
      const res = await api.purchaseCredits(n)
      await refreshUser()
      toast.success(`Compra simulada: +${n} créditos ($${(n * PRICE).toFixed(2)})`)
      await loadPayments()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBuying(null)
    }
  }

  const onPaypalSuccess = async (credits: number, imagesCount: number) => {
    await refreshUser()
    toast.success(`Pago PayPal completado: +${imagesCount} créditos`)
    await loadPayments()
  }

  if (!user && !loading) {
    navigate({ name: 'login' })
    return null
  }

  const total = quantity * PRICE

  return (
    <BackofficeLayout title="Mi cuenta" description="Compra créditos" items={NAV} activeRoute="credits">
      <Seo title="Comprar créditos | MediaPortal" description="Compra créditos de imagen a $0.10 cada uno con PayPal." />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6" /> Comprar créditos
          </h1>
          <p className="text-muted-foreground text-sm">
            1 crédito = 1 imagen adicional · ${PRICE} por crédito · sin caducidad
          </p>
        </div>

        {/* Saldo actual */}
        <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Créditos disponibles</div>
            <div className="text-3xl font-bold">{user?.credits ?? 0}</div>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-medium">{payments.length} compra(s) realizadas</div>
              <div className="text-muted-foreground text-xs flex items-center gap-1.5">
                {paypalEnabled ? (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> PayPal activado
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Modo demo
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Packs rápidos */}
        <div>
          <h2 className="font-semibold mb-3">Paquetes rápidos</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PACKS.map((n) => (
              <Card key={n} className="p-4 space-y-3 hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="text-2xl font-bold">{n}</div>
                  <div className="text-xs text-muted-foreground">créditos</div>
                  <div className="text-sm font-medium mt-1">${(n * PRICE).toFixed(2)}</div>
                </div>
                {paypalEnabled ? (
                  <PayPalButton
                    imagesCount={n}
                    amount={n * PRICE}
                    disabled={buying === n}
                    onSuccess={(c, ic) => onPaypalSuccess(c, ic)}
                  />
                ) : (
                  <Button size="sm" className="w-full" disabled={buying === n} onClick={() => purchaseDemo(n)}>
                    {buying === n ? 'Procesando…' : 'Comprar (demo)'}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Cantidad personalizada */}
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" /> Cantidad personalizada
          </h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Número de créditos</Label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                className="w-40"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <div className="text-xs text-muted-foreground">Total a pagar</div>
              <div className="text-2xl font-bold">${total.toFixed(2)}</div>
            </div>
          </div>

          {paypalEnabled ? (
            <div className="space-y-2">
              <PayPalButton
                imagesCount={quantity}
                amount={total}
                disabled={quantity < 1}
                onSuccess={(c, ic) => onPaypalSuccess(c, ic)}
              />
            </div>
          ) : (
            <>
              <Button disabled={buying !== null || quantity < 1} onClick={() => purchaseDemo(quantity)}>
                {buying !== null ? 'Procesando…' : `Comprar ${quantity} créditos (demo)`}
              </Button>
            </>
          )}

          <Separator />

          {!paypalEnabled ? (
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="shrink-0">ℹ️</span>
              <span>
                En modo demo el pago se simula y se aprueba al instante. Para activar pagos reales con
                PayPal, añade <code className="rounded bg-muted px-1">PAYPAL_CLIENT_ID</code> y{' '}
                <code className="rounded bg-muted px-1">PAYPAL_CLIENT_SECRET</code> en{' '}
                <code className="rounded bg-muted px-1">.env</code> y reinicia el servidor.
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="shrink-0">🔒</span>
              <span>
                El pago se procesa de forma segura a través de PayPal. Al completar la transacción, los
                créditos se acreditarán automáticamente en tu cuenta.
              </span>
            </p>
          )}
        </Card>

        {/* Historial */}
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Historial de compras
          </h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin compras todavía.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => {
                const method = String(p.method || '')
                const isPaypal = method.startsWith('PAYPAL')
                return (
                  <div key={p.id as string} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <div>
                        <div className="font-medium">{p.imagesCount} créditos</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(p.createdAt as string).toLocaleString('es-EC')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${(p.amount as number).toFixed(2)}</div>
                      <Badge variant="secondary" className="text-[10px]">
                        {isPaypal ? 'PayPal' : 'Demo'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </BackofficeLayout>
  )
}
