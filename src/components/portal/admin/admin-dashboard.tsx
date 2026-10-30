'use client'

import { useEffect, useState } from 'react'
import { useApp, type Route } from '@/stores/app-store'
import { api } from '@/lib/api'
import { BackofficeLayout } from '../backoffice-layout'
import { Seo } from '../seo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LayoutDashboard,
  Users,
  FolderTree,
  ShieldAlert,
  Images,
  DollarSign,
  TrendingUp,
  Eye,
  AlertCircle,
} from 'lucide-react'

const NAV: { label: string; route: Route; icon: React.ReactNode }[] = [
  { label: 'Estadísticas', route: { name: 'admin' }, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Categorías', route: { name: 'admin-categories' }, icon: <FolderTree className="h-4 w-4" /> },
  { label: 'Usuarios', route: { name: 'admin-users' }, icon: <Users className="h-4 w-4" /> },
  { label: 'Moderar media', route: { name: 'admin-media' }, icon: <ShieldAlert className="h-4 w-4" /> },
]

export function AdminDashboard() {
  const { user, navigate, refreshUser } = useApp()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate({ name: 'home' })
      return
    }
    if (!user) return
    let active = true
    ;(async () => {
      try {
        const res = await api.adminStats()
        if (active) setData(res)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [user, navigate])

  if (!user) {
    navigate({ name: 'login' })
    return null
  }
  if (user.role !== 'ADMIN') return null

  const stats = (data?.stats || {}) as Record<string, number>
  const recentMedia = (data?.recentMedia || []) as Array<Record<string, unknown>>
  const categoryStats = (data?.categoryStats || []) as Array<{ name: string; count: number }>
  const payments = (data?.payments || []) as Array<Record<string, unknown>>
  const maxCount = Math.max(...categoryStats.map((c) => c.count), 1)

  return (
    <BackofficeLayout title="Backoffice Admin" description="Gestión del portal" items={NAV} activeRoute="admin">
      <Seo title="Admin · Estadísticas | MediaPortal" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Estadísticas generales</h1>
            <p className="text-muted-foreground text-sm">Visión global del portal</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refreshUser()}>Actualizar</Button>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Usuarios" value={stats.users} tone="primary" loading={loading} />
          <StatCard icon={<Images className="h-5 w-5" />} label="Imágenes" value={stats.media} tone="emerald" loading={loading} />
          <StatCard icon={<FolderTree className="h-5 w-5" />} label="Categorías" value={stats.categories} tone="sky" loading={loading} />
          <StatCard icon={<DollarSign className="h-5 w-5" />} label="Ingresos" value={`$${(stats.revenue || 0).toFixed(2)}`} tone="amber" loading={loading} />
        </div>

        {stats.pending > 0 && (
          <Card className="p-4 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <div className="font-medium text-amber-800 dark:text-amber-300">{stats.pending} imagen(es) pendiente(s) de moderación</div>
                <div className="text-sm text-amber-700 dark:text-amber-400">Revisa y aprueba el contenido subido</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate({ name: 'admin-media' })}>
                Moderar
              </Button>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top categorías */}
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Imágenes por categoría
            </h2>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6" />)}</div>
            ) : categoryStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos.</p>
            ) : (
              <div className="space-y-3">
                {categoryStats.map((c) => (
                  <div key={c.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{c.name}</span>
                      <span className="text-muted-foreground">{c.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pagos recientes */}
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Pagos recientes
            </h2>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => {
                  const u = p.user as { email: string; name: string | null } | null
                  return (
                    <div key={p.id as string} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{u?.name || u?.email}</div>
                        <div className="text-xs text-muted-foreground">{p.imagesCount} créditos</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${(p.amount as number).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{new Date(p.createdAt as string).toLocaleDateString('es-EC')}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Media reciente */}
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Images className="h-4 w-4" /> Subidas recientes
          </h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <div className="space-y-2">
              {recentMedia.map((m) => {
                const cat = m.category as { name: string } | null
                const usr = m.user as { email: string; name: string | null } | null
                return (
                  <div key={m.id as string} className="flex items-center gap-3 rounded-md border p-2 text-sm">
                    <div className="h-10 w-10 rounded overflow-hidden bg-muted shrink-0">
                      {(m.thumbnailUrl || m.url) && <img src={(m.thumbnailUrl || m.url) as string} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{m.title as string}</div>
                      <div className="text-xs text-muted-foreground">{cat?.name} · por {usr?.name || usr?.email}</div>
                    </div>
                    <Badge variant="secondary">{m.status as string}</Badge>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate({ name: 'media', id: m.id as string })}>
                      <Eye className="h-4 w-4" />
                    </Button>
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

function StatCard({
  icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value?: React.ReactNode
  tone: 'primary' | 'emerald' | 'sky' | 'amber'
  loading?: boolean
}) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  }
  return (
    <Card className="p-4">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</span>
      <div className="mt-3 text-2xl font-bold">{loading ? '…' : value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  )
}
