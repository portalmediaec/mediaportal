'use client'

import { useEffect, useState } from 'react'
import { useApp, type Route } from '@/stores/app-store'
import { api } from '@/lib/api'
import { BackofficeLayout } from '../backoffice-layout'
import { Seo } from '../seo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { LayoutDashboard, Users, FolderTree, ShieldAlert, Search, ShieldCheck, Pencil, Trash2, User as UserIcon } from 'lucide-react'

const NAV: { label: string; route: Route; icon: React.ReactNode }[] = [
  { label: 'Estadísticas', route: { name: 'admin' }, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Categorías', route: { name: 'admin-categories' }, icon: <FolderTree className="h-4 w-4" /> },
  { label: 'Usuarios', route: { name: 'admin-users' }, icon: <Users className="h-4 w-4" /> },
  { label: 'Moderar media', route: { name: 'admin-media' }, icon: <ShieldAlert className="h-4 w-4" /> },
]

type UserRow = {
  id: string
  email: string
  name: string | null
  role: string
  credits: number
  company: string | null
  createdAt: string
  _count: { media: number; payments: number }
}

export function AdminUsers() {
  const { user, navigate, refreshUser } = useApp()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState<UserRow | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.adminUsers(search)
      setUsers(res.users as unknown as UserRow[])
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
  }, [search, user])

  if (!user) {
    navigate({ name: 'login' })
    return null
  }
  if (user.role !== 'ADMIN') return null

  return (
    <BackofficeLayout title="Backoffice Admin" description="Gestión del portal" items={NAV} activeRoute="admin-users">
      <Seo title="Admin · Usuarios | MediaPortal" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground text-sm">{users.length} usuario(s)</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por email o nombre…" className="pl-9" />
        </div>

        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : users.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-center">Créditos</TableHead>
                    <TableHead className="text-center">Imágenes</TableHead>
                    <TableHead className="text-center">Pagos</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                            {(u.name || u.email)[0].toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{u.name || u.email}</div>
                            <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.role === 'ADMIN' ? (
                          <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> Admin</Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1"><UserIcon className="h-3 w-3" /> Usuario</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium">{u.credits}</TableCell>
                      <TableCell className="text-center">{u._count.media}</TableCell>
                      <TableCell className="text-center">{u._count.payments}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('es-EC')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(u)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            disabled={u.id === user.id}
                            onClick={() => setDeleting(u)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {editing && (
        <EditUserDialog
          user={editing}
          currentUserId={user.id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
            refreshUser()
          }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la cuenta de “{deleting?.email}” y todas sus imágenes. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleting) return
                try {
                  await api.adminDeleteUser(deleting.id)
                  toast.success('Usuario eliminado')
                  setDeleting(null)
                  load()
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

function EditUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: UserRow
  currentUserId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [role, setRole] = useState(user.role)
  const [credits, setCredits] = useState(String(user.credits))
  const [name, setName] = useState(user.name || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await api.adminUpdateUser(user.id, { role, credits: parseInt(credits) || 0, name })
      toast.success('Usuario actualizado')
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
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input value={user.email} disabled />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Rol</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Usuario</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Créditos</label>
              <Input type="number" min={0} value={credits} onChange={(e) => setCredits(e.target.value)} />
            </div>
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
