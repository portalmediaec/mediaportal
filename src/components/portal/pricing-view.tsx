'use client'

import { useApp } from '@/stores/app-store'
import { Seo } from './seo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ImagePlus, Wallet, Sparkles } from 'lucide-react'

export function PricingView() {
  const { navigate, user } = useApp()

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <Seo
        title="Precios | MediaPortal"
        description="Planes y precios de MediaPortal. Cuenta gratis con 5 imágenes por categoría y $0.10 por imagen adicional."
        keywords="precios, planes, imagen, suscripción, mediaportal"
      />

      <div className="text-center max-w-2xl mx-auto mb-10">
        <Badge variant="secondary" className="mb-3 gap-1.5">
          <Wallet className="h-3 w-3" /> Precios simples y transparentes
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">Paga solo por lo que subes</h1>
        <p className="mt-3 text-muted-foreground">
          Empieza gratis con 5 imágenes por categoría. Cuando necesites más, paga solo{' '}
          <strong>$0.10 por imagen</strong>. Sin suscripciones ni mensualidades.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
        {/* Plan gratis */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold">Cuenta gratuita</h2>
            <p className="text-sm text-muted-foreground">Perfecto para empezar</p>
          </div>
          <div>
            <span className="text-4xl font-bold">$0</span>
            <span className="text-muted-foreground"> / siempre</span>
          </div>
          <ul className="space-y-2 text-sm">
            <Benefit>5 imágenes gratis por categoría</Benefit>
            <Benefit>Subida masiva de archivos</Benefit>
            <Benefit>Metadatos SEO por imagen</Benefit>
            <Benefit>Enlaces externos en cada imagen</Benefit>
            <Benefit>Backoffice de usuario</Benefit>
          </ul>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate({ name: user ? 'upload' : 'login' })}
          >
            {user ? 'Subir imágenes' : 'Crear cuenta gratis'}
          </Button>
        </Card>

        {/* Plan pago */}
        <Card className="p-6 space-y-4 border-primary shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
            Más popular
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" /> Créditos por imagen
            </h2>
            <p className="text-sm text-muted-foreground">Para escalar tu catálogo</p>
          </div>
          <div>
            <span className="text-4xl font-bold">$0.10</span>
            <span className="text-muted-foreground"> / imagen</span>
          </div>
          <ul className="space-y-2 text-sm">
            <Benefit>Imágenes ilimitadas por categoría</Benefit>
            <Benefit>1 crédito = 1 imagen adicional</Benefit>
            <Benefit>Compra desde 1 hasta 1000 créditos</Benefit>
            <Benefit>Sin caducidad de créditos</Benefit>
            <Benefit>Prioridad de indexación SEO</Benefit>
            <Benefit>Reembolso automático al borrar imagen de pago</Benefit>
          </ul>
          <Button className="w-full" onClick={() => navigate({ name: user ? 'credits' : 'login' })}>
            <ImagePlus className="h-4 w-4 mr-1.5" /> Comprar créditos
          </Button>
        </Card>
      </div>

      <div className="mt-10 text-center text-sm text-muted-foreground">
        ¿Tienes preguntas? Escríbenos a{' '}
        <span className="font-medium text-foreground">soporte@mediaportal.com</span>
      </div>
    </div>
  )
}

function Benefit({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  )
}
