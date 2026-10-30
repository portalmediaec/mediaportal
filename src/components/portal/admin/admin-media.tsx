'use client'

import { useEffect, useState } from 'react'
import { useApp, type Route } from '@/stores/app-store'
import { api, type MediaItem } from '@/lib/api'
import { BackofficeLayout } from '../backoffice-layout'
import { Seo } from '../seo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  Users,
  FolderTree,
  ShieldAlert,
  Search,
  Check,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV: { label: string; route: Route; icon: React.ReactNode }[] = [
  { label: 'Estadísticas', route: { name: 'admin' }, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Categorías', route: { name: 'admin-categories' }, icon: <FolderTree className="h-4 w-4" /> },
  { label: 'Usuarios', route: { name: 'admin-users' }, icon: <Users className="h-4 w-4" /> },
  { label: 'Moderar media', route: { name: 'admin-media' }, icon: <ShieldAlert className="h-4 w-4" /> },
]

const STATUS = [
  { key: '', label: 'Todos' },
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'APPROVED', label: 'Aprobados' },
  { key: 'REJECTED', label: 'Rechazados' },
]

export function AdminMedia() {
  const { user, navigate } = useApp()
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.adminMedia({ status: status || undefined, search: search || undefined, page })
      setItems(res.items)
      setPages(res.pages)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate({ name: 'home' })
    }
  }, [user, navigate])

  useEffect(() => {
    if (!user) {
      navigate({ name: 'login' })
      return
    }
    if (user.role !== 'ADMIN') return
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [status, search, page, user])

  if (!user) {
    navigate({ name: 'login' })
    return null
  }
  if (user.role !== 'ADMIN') return null

  const moderate = async (id: string, newStatus: string) => {
    try {
      await api.adminModerate(id, newStatus)
      toast.success(newStatus === 'APPROVED' ? 'Aprobado' : newStatus === 'REJECTED' ? 'Rechazado' : 'Actualizado')
      load()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const remove = async (id: string) => {
    try {
      await api.deleteMedia(id)
      toast.success('Imagen eliminada')
      load()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <BackofficeLayout title="Backoffice Admin" description="Gestión del portal" items={NAV} activeRoute="admin-media">
      <Seo title="Admin · Moderar media | MediaPortal" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Moderar imágenes</h1>
          <p className="text-muted-foreground text-sm">Aprueba, rechaza o elimina contenido</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar…" className="pl-9" />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS.map((s) => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
          </div>
        ) : items.length === 0 ? (
          <Card className="p-10 text-center">
            <ShieldAlert className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <p className="mt-3 text-muted-foreground">No hay imágenes para mostrar.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m) => (
              <Card key={m.id} className="overflow-hidden p-0 gap-0">
                <div className="relative aspect-video bg-muted">
                  {m.type === 'VIDEO' ? (
                    <video src={m.url} className="h-full w-full object-cover" />
                  ) : (
                    <img src={m.thumbnailUrl || m.url} alt={m.title} className="h-full w-full object-cover" />
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge variant="secondary" className="bg-background/90">{m.type}</Badge>
                    <StatusBadge status={m.status} />
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="font-medium text-sm line-clamp-1">{m.title}</h3>
                  <div className="text-xs text-muted-foreground">
                    {m.category?.name} · por {m.user?.name || m.user?.email}
                  </div>
                  {m.description && <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>}
                  <div className="flex items-center gap-1 pt-1">
                    <Button size="sm" variant="outline" className="h-7 flex-1" onClick={() => navigate({ name: 'media', id: m.id })}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 flex-1 text-emerald-600 hover:text-emerald-700" disabled={m.status === 'APPROVED'} onClick={() => moderate(m.id, 'APPROVED')}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 flex-1 text-amber-600 hover:text-amber-700" disabled={m.status === 'REJECTED'} onClick={() => moderate(m.id, 'REJECTED')}>
                      <X className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 flex-1 text-destructive" onClick={() => remove(m.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Página {page} de {pages}</span>
            <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </BackofficeLayout>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    APPROVED: 'bg-emerald-500 text-white',
    PENDING: 'bg-amber-500 text-white',
    REJECTED: 'bg-destructive text-destructive-foreground',
  }
  return <Badge className={cn('text-[10px]', map[status] || 'bg-muted')}>{status}</Badge>
}
