'use client'

import { useEffect, useState } from 'react'
import { useApp, type Route } from '@/stores/app-store'
import { api, type Category } from '@/lib/api'
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
import { LayoutDashboard, Users, FolderTree, ShieldAlert, Plus, Pencil, Trash2, Folder } from 'lucide-react'
import { CategoryIcon, categoryColor } from '../icons'
import { cn } from '@/lib/utils'

const NAV: { label: string; route: Route; icon: React.ReactNode }[] = [
  { label: 'Estadísticas', route: { name: 'admin' }, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Categorías', route: { name: 'admin-categories' }, icon: <FolderTree className="h-4 w-4" /> },
  { label: 'Usuarios', route: { name: 'admin-users' }, icon: <Users className="h-4 w-4" /> },
  { label: 'Moderar media', route: { name: 'admin-media' }, icon: <ShieldAlert className="h-4 w-4" /> },
]

const ICONS = ['Store', 'Cpu', 'Plane', 'Shirt', 'Palette', 'Home', 'Image', 'Film', 'Camera', 'Tag']
const COLORS = ['amber', 'emerald', 'sky', 'pink', 'violet', 'orange']

export function AdminCategories() {
  const { user, navigate, categories, refreshCategories } = useApp()
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Category | null>(null)

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate({ name: 'home' })
    }
  }, [user, navigate])

  if (!user) {
    navigate({ name: 'login' })
    return null
  }
  if (user.role !== 'ADMIN') return null

  return (
    <BackofficeLayout title="Backoffice Admin" description="Gestión del portal" items={NAV} activeRoute="admin-categories">
      <Seo title="Admin · Categorías | MediaPortal" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Categorías</h1>
            <p className="text-muted-foreground text-sm">{categories.length} categorías principales</p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Nueva categoría
          </Button>
        </div>

        <div className="space-y-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="p-4">
              <div className="flex items-start gap-3">
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', categoryColor(cat.color))}>
                  <CategoryIcon name={cat.icon} className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{cat.name}</h3>
                    <Badge variant="secondary">{cat.mediaCount}</Badge>
                  </div>
                  {cat.description && <p className="text-sm text-muted-foreground mt-0.5">{cat.description}</p>}
                  {cat.children?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cat.children.map((sub) => (
                        <div key={sub.id} className="group flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
                          <Folder className="h-3 w-3 text-muted-foreground" />
                          <span>{sub.name}</span>
                          <span className="text-muted-foreground">· {sub.mediaCount}</span>
                          <button
                            onClick={() => setEditing(sub)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(cat)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleting(cat)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {categories.length === 0 && (
            <Card className="p-10 text-center">
              <FolderTree className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <p className="mt-3 text-muted-foreground">No hay categorías. Crea la primera.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog crear/editar */}
      {(creating || editing) && (
        <CategoryDialog
          category={editing}
          parents={categories}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSaved={() => {
            refreshCategories()
            setCreating(false)
            setEditing(null)
          }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará “{deleting?.name}”. Las imágenes asociadas también se eliminarán si es una categoría principal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleting) return
                try {
                  await api.deleteCategory(deleting.id)
                  toast.success('Categoría eliminada')
                  refreshCategories()
                  setDeleting(null)
                } catch (e) {
                  toast.error((e as Error).message)
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BackofficeLayout>
  )
}

function CategoryDialog({
  category,
  parents,
  onClose,
  onSaved,
}: {
  category: Category | null
  parents: Category[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(category?.name || '')
  const [description, setDescription] = useState(category?.description || '')
  const [icon, setIcon] = useState(category?.icon || 'Store')
  const [color, setColor] = useState(category?.color || 'amber')
  const [parentId, setParentId] = useState(category?.parentId || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    setSaving(true)
    try {
      const data: Record<string, unknown> = { name, description, icon, color, parentId: parentId || null }
      if (category) {
        await api.updateCategory(category.id, data)
        toast.success('Categoría actualizada')
      } else {
        await api.createCategory(data)
        toast.success('Categoría creada')
      }
      onSaved()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Restaurantes" />
          </div>
          {!category?.parentId && (
            <div className="space-y-1.5">
              <Label className="text-xs">Categoría padre (dejar vacío para categoría principal)</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger><SelectValue placeholder="Categoría principal" /></SelectTrigger>
                <SelectContent>
                  {parents.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Icono</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ICONS.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLORS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-md', categoryColor(color))}>
              <CategoryIcon name={icon} className="h-4 w-4" />
            </span>
            <span className="text-xs text-muted-foreground">Vista previa</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
