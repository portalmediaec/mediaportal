'use client'

import { useEffect, useState } from 'react'
import { useApp, type Route } from '@/stores/app-store'
import { api } from '@/lib/api'
import { BackofficeLayout } from '../backoffice-layout'
import { Seo } from '../seo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { LayoutDashboard, ImagePlus, FolderOpen, Wallet, CreditCard, CheckCircle2, Receipt } from 'lucide-react'

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
  const [buying, setBuying] = useState(false)
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate({ name: 'login' })
      return
    }
    let active = true
    ;(async () => {
      try {
        const res = await api.payments()
        if (active) setPayments(res.payments)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [user, navigate])

  const purchase = async (n: number) => {
    setBuying(true)
    try {
      const res = await api.purchaseCredits(n)
      await refreshUser()
      toast.success(`Compra exitosa: +${n} créditos ($${(n * PRICE).toFixed(2)})`)
      const payRes = await api.payments()
      setPayments(payRes.payments)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBuying(false)
    }
  }

  if (!user && !loading) {
    navigate({ name: 'login' })
    return null
  }

  const total = quantity * PRICE

  return (
    <BackofficeLayout title="Mi cuenta" description="Compra créditos" items={NAV} activeRoute="credits">
      <Seo title="Comprar créditos | MediaPortal" description="Compra créditos de imagen a $0.10 cada uno." />

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
              <div className="text-muted-foreground text-xs">Método: simulado (demo)</div>
            </div>
          </div>
        </Card>

        {/* Packs rápidos */}
        <div>
          <h2 className="font-semibold mb-3">Paquetes rápidos</h2>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PACKS.map((n) => (
              <Card key={n} className="p-4 text-center space-y-2 hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold">{n}</div>
                <div className="text-xs text-muted-foreground">créditos</div>
                <div className="text-sm font-medium">${(n * PRICE).toFixed(2)}</div>
                <Button size="sm" className="w-full" disabled={buying} onClick={() => purchase(n)}>
                  Comprar
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Cantidad personalizada */}
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Cantidad personalizada</h2>
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
            <Button disabled={buying || quantity < 1} onClick={() => purchase(quantity)}>
              {buying ? 'Procesando…' : `Comprar ${quantity} créditos`}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            ℹ️ En este entorno demo el pago se simula y se aprueba al instante. En producción se
            integraría una pasarela real (Stripe, PayPal, etc.).
          </p>
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
              {payments.map((p) => (
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
                    <Badge variant="secondary" className="text-[10px]">{p.status as string}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </BackofficeLayout>
  )
}
