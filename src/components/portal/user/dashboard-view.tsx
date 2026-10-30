'use client'

import { useEffect, useState } from 'react'
import { useApp, type Route } from '@/stores/app-store'
import { api } from '@/lib/api'
import { BackofficeLayout } from '../backoffice-layout'
import { Seo } from '../seo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LayoutDashboard,
  ImagePlus,
  FolderOpen,
  Wallet,
  Eye,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  TrendingUp,
} from 'lucide-react'

const NAV: { label: string; route: Route; icon: React.ReactNode }[] = [
  { label: 'Panel', route: { name: 'dashboard' }, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Subir imágenes', route: { name: 'upload' }, icon: <ImagePlus className="h-4 w-4" /> },
  { label: 'Mis imágenes', route: { name: 'my-media' }, icon: <FolderOpen className="h-4 w-4" /> },
  { label: 'Comprar créditos', route: { name: 'credits' }, icon: <Wallet className="h-4 w-4" /> },
]

type Stats = {
  stats: { totalMedia: number; approved: number; pending: number; rejected: number; totalViews: number; credits: number; spent: number; imagesPurchased: number }
  recentMedia: Array<{ id: string; title: string; url: string; thumbnailUrl: string | null; type: string; status: string; views: number; createdAt: string }>
  usageByCategory: Array<{ categoryId: string; name: string; count: number; freeUsed: number; paidUsed: number; freeLimit: number }>
  payments: Array<Record<string, unknown>>
  pricePerImage: number
  freeLimitPerCategory: number
}

export function DashboardView() {
  const { user, navigate, refreshUser } = useApp()
  const [data, setData] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = (await api.myStats()) as unknown as Stats
        if (active) setData(res)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  if (!user && !loading) {
    navigate({ name: 'login' })
    return null
  }

  const s = data?.stats

  return (
    <BackofficeLayout title="Mi cuenta" description="Gestiona tus imágenes" items={NAV} activeRoute="dashboard">
      <Seo title="Mi panel | MediaPortal" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Hola, {user?.name || user?.email} 👋</h1>
          <p className="text-muted-foreground text-sm">Resumen de tu actividad en MediaPortal</p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<ImageIcon className="h-5 w-5" />} label="Imágenes totales" value={loading ? '…' : s?.totalMedia} tone="primary" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Aprobadas" value={loading ? '…' : s?.approved} tone="emerald" />
          <StatCard icon={<Eye className="h-5 w-5" />} label="Vistas totales" value={loading ? '…' : s?.totalViews} tone="sky" />
          <StatCard icon={<Wallet className="h-5 w-5" />} label="Créditos disponibles" value={loading ? '…' : s?.credits} tone="amber" />
        </div>

        {/* Quick actions */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Button className="justify-start" onClick={() => navigate({ name: 'upload' })}>
            <ImagePlus className="h-4 w-4 mr-2" /> Subir nuevas imágenes
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate({ name: 'my-media' })}>
            <FolderOpen className="h-4 w-4 mr-2" /> Gestionar mis imágenes
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate({ name: 'credits' })}>
            <Wallet className="h-4 w-4 mr-2" /> Comprar más créditos
          </Button>
        </div>

        {/* Uso por categoría */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Uso por categoría</h2>
            <Badge variant="secondary">{data?.freeLimitPerCategory ?? 5} gratis · ${data?.pricePerImage ?? 0.1}/extra</Badge>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : data?.usageByCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aún no has subido imágenes. ¡Empieza ahora!</p>
          ) : (
            <div className="space-y-3">
              {data?.usageByCategory.map((u) => {
                const pct = Math.min(100, (u.count / u.freeLimit) * 100)
                return (
                  <div key={u.categoryId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{u.name}</span>
                      <span className="text-muted-foreground">
                        {u.count} imágenes · {u.freeUsed} gratis
                        {u.paidUsed > 0 && <span className="text-amber-600"> · {u.paidUsed} pagadas</span>}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Recientes */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Subidas recientes</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate({ name: 'my-media' })}>
              Ver todas
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : data?.recentMedia.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin imágenes todavía.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {data?.recentMedia.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate({ name: 'media', id: m.id })}
                  className="group relative aspect-square overflow-hidden rounded-md bg-muted"
                >
                  <img src={m.thumbnailUrl || m.url} alt={m.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                    <span className="text-[9px] text-white line-clamp-1">{m.title}</span>
                  </div>
                  {m.status === 'PENDING' && (
                    <span className="absolute top-1 right-1 rounded bg-amber-500 px-1 text-[8px] text-white">Pendiente</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </BackofficeLayout>
  )
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value?: React.ReactNode
  tone: 'primary' | 'emerald' | 'sky' | 'amber'
}) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  }
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  )
}
