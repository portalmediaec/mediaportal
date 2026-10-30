'use client'

import { useEffect, useState } from 'react'
import { useApp, type Route } from '@/stores/app-store'
import { api, type MediaItem } from '@/lib/api'
import { BackofficeLayout } from '../backoffice-layout'
import { Seo } from '../seo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  ImagePlus,
  FolderOpen,
  Wallet,
  Search,
  Pencil,
  Trash2,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ImageOff,
} from 'lucide-react'

const NAV: { label: string; route: Route; icon: React.ReactNode }[] = [
  { label: 'Panel', route: { name: 'dashboard' }, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Subir imágenes', route: { name: 'upload' }, icon: <ImagePlus className="h-4 w-4" /> },
  { label: 'Mis imágenes', route: { name: 'my-media' }, icon: <FolderOpen className="h-4 w-4" /> },
  { label: 'Comprar créditos', route: { name: 'credits' }, icon: <Wallet className="h-4 w-4" /> },
]

export function MyMediaView() {
  const { user, navigate, refreshUser, categories } = useApp()
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [editing, setEditing] = useState<MediaItem | null>(null)
  const [deleting, setDeleting] = useState<MediaItem | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.myMedia(search, page)
      setItems(res.items)
      setPages(res.pages)
      setTotal(res.total)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      navigate({ name: 'login' })
      return
    }
    load()
  }, [page, search])

  const onDelete = async () => {
    if (!deleting) return
    try {
      await api.deleteMedia(deleting.id)
      await refreshUser()
      toast.success('Imagen eliminada. Si era de pago, se reembolsó 1 crédito.')
      setDeleting(null)
      load()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  if (!user && !loading) {
    navigate({ name: 'login' })
    return null
  }

  return (
    <BackofficeLayout title="Mi cuenta" description="Gestiona tus imágenes" items={NAV} activeRoute="my-media">
      <Seo title="Mis imágenes | MediaPortal" />

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Mis imágenes</h1>
            <p className="text-muted-foreground text-sm">{total} imagen(es) en total</p>
          </div>
          <Button onClick={() => navigate({ name: 'upload' })}>
            <ImagePlus className="h-4 w-4 mr-1.5" /> Subir más
          </Button>
        </div>

        {/* Búsqueda */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar en mis imágenes…"
            className="pl-9"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ImageOff className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Aún no has subido imágenes.</p>
            <Button className="mt-4" onClick={() => navigate({ name: 'upload' })}>
              Subir mi primera imagen
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((m) => (
              <Card key={m.id} className="overflow-hidden p-0 gap-0 group">
                <div className="relative aspect-square bg-muted overflow-hidden">
                  <img src={m.thumbnailUrl || m.url} alt={m.title} className="h-full w-full object-cover" />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge variant="secondary" className="bg-background/90">{m.type}</Badge>
                    {m.status === 'PENDING' && <Badge className="bg-amber-500">Pendiente</Badge>}
                    {m.status === 'REJECTED' && <Badge variant="destructive">Rechazada</Badge>}
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px]">
                    <Eye className="h-3 w-3" /> {m.views}
                  </div>
                  {/* Acciones */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => navigate({ name: 'media', id: m.id })}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setEditing(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setDeleting(m)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3 space-y-1">
                  <h3 className="font-medium text-sm line-clamp-1">{m.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{m.category?.name}{m.subcategory ? ` / ${m.subcategory.name}` : ''}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Paginación */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <span className="text-sm text-muted-foreground">Página {page} de {pages}</span>
            <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Dialog edición */}
      {editing && (
        <EditDialog media={editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />
      )}

      {/* Dialog confirmar eliminar */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará “{deleting?.title}” permanentemente. Si la imagen era de pago (excedía el cupo gratis), se reembolsará 1 crédito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BackofficeLayout>
  )
}

function EditDialog({
  media,
  categories,
  onClose,
  onSaved,
}: {
  media: MediaItem
  categories: Array<{ id: string; name: string; children?: Array<{ id: string; name: string }> }>
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    title: media.title,
    description: media.description || '',
    externalLink: media.externalLink || '',
    altText: media.altText || '',
    seoTitle: media.seoTitle || '',
    seoDescription: media.seoDescription || '',
    seoKeywords: media.seoKeywords || '',
    tags: media.tags || '',
    categoryId: media.categoryId,
    subcategoryId: media.subcategoryId || '',
  })
  const [saving, setSaving] = useState(false)

  const subcategories = categories.find((c) => c.id === form.categoryId)?.children || []

  const save = async () => {
    setSaving(true)
    try {
      await api.updateMedia(media.id, {
        ...form,
        subcategoryId: form.subcategoryId || null,
      })
      toast.success('Cambios guardados')
      onSaved()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar imagen</DialogTitle>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Título</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Descripción</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Categoría</Label>
            <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v, subcategoryId: '' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subcategoría</Label>
            <Select value={form.subcategoryId} onValueChange={(v) => setForm({ ...form, subcategoryId: v })}>
              <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
              <SelectContent>
                {subcategories.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Enlace externo</Label>
            <Input value={form.externalLink} onChange={(e) => setForm({ ...form, externalLink: e.target.value })} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Texto alternativo (alt)</Label>
            <Input value={form.altText} onChange={(e) => setForm({ ...form, altText: e.target.value })} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Título SEO</Label>
            <Input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Meta description SEO</Label>
            <Textarea value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Palabras clave SEO</Label>
            <Input value={form.seoKeywords} onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })} placeholder="kw1, kw2…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tags</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="tag1, tag2…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
