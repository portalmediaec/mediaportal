'use client'

import { useState } from 'react'
import { useApp } from '@/stores/app-store'
import { api } from '@/lib/api'
import { Seo } from './seo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Images, Mail, Lock, User, Building, Globe, CheckCircle2 } from 'lucide-react'

export function AuthView() {
  const { refreshUser, navigate } = useApp()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)

  // login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // register state
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [website, setWebsite] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const { user } = await api.login(email, password)
        await refreshUser()
        toast.success(`Bienvenido, ${user.name || user.email}`)
        navigate({ name: 'dashboard' })
      } else {
        const { user } = await api.register({ email, password, name, company, website })
        await refreshUser()
        toast.success(`Cuenta creada. ¡Bienvenido, ${user.name || user.email}!`)
        navigate({ name: 'dashboard' })
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (kind: 'admin' | 'user') => {
    setMode('login')
    if (kind === 'admin') {
      setEmail('admin@mediaportal.com')
      setPassword('admin123')
    } else {
      setEmail('usuario@demo.com')
      setPassword('demo123')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <Seo title="Iniciar sesión / Crear cuenta | MediaPortal" description="Accede a tu cuenta o crea una gratis para subir hasta 5 imágenes por categoría." />

      <div className="grid lg:grid-cols-2 gap-8 items-center">
        {/* Lado beneficios */}
        <div className="hidden lg:block space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Images className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Únete a MediaPortal</h1>
              <p className="text-muted-foreground text-sm">Tu directorio multimedia con SEO</p>
            </div>
          </div>
          <ul className="space-y-3">
            {[
              'Cuenta gratuita: sube hasta 5 imágenes por categoría',
              'Subida masiva con arrastrar y soltar',
              'Metadatos SEO por imagen (title, description, keywords)',
              'Categorías y subcategorías organizadas',
              'Solo $0.10 por imagen adicional',
              'Backoffice para gestionar tu contenido',
            ].map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <Card className="p-4 bg-muted/40 border-dashed">
            <p className="text-xs font-medium mb-2">Cuentas de demostración</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={() => fillDemo('admin')}>
                Probar como Admin
              </Button>
              <Button variant="outline" size="sm" onClick={() => fillDemo('user')}>
                Probar como Usuario
              </Button>
            </div>
          </Card>
        </div>

        {/* Formulario */}
        <Card className="p-6 sm:p-8">
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="register">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={submit} className="space-y-4">
                <Field icon={<Mail className="h-4 w-4" />} label="Email">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
                </Field>
                <Field icon={<Lock className="h-4 w-4" />} label="Contraseña">
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                </Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Entrando…' : 'Iniciar sesión'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form onSubmit={submit} className="space-y-4">
                <Field icon={<User className="h-4 w-4" />} label="Nombre">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
                </Field>
                <Field icon={<Mail className="h-4 w-4" />} label="Email">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
                </Field>
                <Field icon={<Lock className="h-4 w-4" />} label="Contraseña (mín. 6 caracteres)">
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field icon={<Building className="h-4 w-4" />} label="Empresa">
                    <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Opcional" />
                  </Field>
                  <Field icon={<Globe className="h-4 w-4" />} label="Sitio web">
                    <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Opcional" />
                  </Field>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creando…' : 'Crear cuenta gratis'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Al registrarte obtienes 5 imágenes gratis por categoría.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        {icon} {label}
      </Label>
      {children}
    </div>
  )
}
