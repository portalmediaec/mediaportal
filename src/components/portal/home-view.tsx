'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/stores/app-store'
import { api, type MediaItem } from '@/lib/api'
import { Seo } from './seo'
import { MediaCard, MediaCardSkeleton } from './media-card'
import { CategoryIcon, categoryColor } from './icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Images, ImagePlus, Search, Sparkles, TrendingUp, ShieldCheck, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

export function HomeView() {
  const { categories, navigate, categoriesLoading } = useApp()
  const [recent, setRecent] = useState<MediaItem[]>([])
  const [popular, setPopular] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const [r, p] = await Promise.all([api.media({ page: 1, limit: 12 }), api.media({ page: 1, limit: 8, sort: 'popular' })])
        if (!active) return
        setRecent(r.items)
        setPopular(p.items)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) navigate({ name: 'search', q: search.trim() })
  }

  const totalImages = categories.reduce((a, c) => a + (c.mediaCount || 0), 0)

  return (
    <div>
      <Seo
        title="MediaPortal · Directorio de imágenes y vídeos para negocios"
        description="Aloja y descubre imágenes, GIFs y vídeos organizados por categorías. Optimizado para SEO e indexación. Sube hasta 5 imágenes gratis por categoría."
        keywords="directorio de imágenes, banco de imágenes, multimedia, SEO, categorías, negocios, imágenes gratis, hosting de imágenes"
        image="/uploads/seed-playas.jpg"
      />

      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 dark:from-amber-950/20 dark:via-rose-950/10 dark:to-sky-950/20" />
        <div className="absolute inset-0 -z-10 opacity-[0.04] dark:opacity-[0.08]" style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <Sparkles className="h-3 w-3" /> Directorio multimedia con SEO
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              Aloja, categoriza y posiciona
              <span className="block bg-gradient-to-r from-amber-600 via-rose-600 to-sky-600 bg-clip-text text-transparent">
                tus imágenes de negocio
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Un directorio inteligente de imágenes, GIFs y vídeos con enlaces, organizado por
              categorías y subcategorías. Optimizado para buscadores con metadatos SEO en cada
              archivo. Sube hasta <strong>5 imágenes gratis</strong> por categoría.
            </p>

            <form onSubmit={submitSearch} className="relative mx-auto mt-8 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busca imágenes: restaurantes, playas, moda…"
                className="h-12 pl-12 pr-28 text-base shadow-sm"
                aria-label="Buscar imágenes"
              />
              <Button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9">
                Buscar
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate({ name: 'login' })} className="gap-2">
                <ImagePlus className="h-5 w-5" /> Subir mis imágenes
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate({ name: 'pricing' })}>
                Ver precios
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto">
              <Stat icon={<Images className="h-5 w-5" />} value={totalImages} label="Imágenes" />
              <Stat icon={<Tag className="h-5 w-5" />} value={categories.length} label="Categorías" />
              <Stat icon={<TrendingUp className="h-5 w-5" />} value="$0.10" label="Por imagen" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature
            icon={<Search className="h-5 w-5" />}
            title="Buscador optimizado"
            desc="Búsqueda por título, etiquetas y palabras clave. Resultados indexables."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="SEO por imagen"
            desc="Cada imagen lleva su título, descripción, alt text y metadatos Open Graph."
          />
          <Feature
            icon={<ImagePlus className="h-5 w-5" />}
            title="Subida masiva"
            desc="Arrastra múltiples archivos a la vez y distribúyelos por categorías."
          />
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Explora por categorías</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Directorio organizado de imágenes para tu negocio
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoriesLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-32 animate-pulse bg-muted/40" />
              ))
            : categories.map((cat) => (
                <Card
                  key={cat.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate({ name: 'category', categoryId: cat.id })}
                  onKeyDown={(e) => e.key === 'Enter' && navigate({ name: 'category', categoryId: cat.id })}
                  className="group cursor-pointer p-5 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start gap-4">
                    <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', categoryColor(cat.color))}>
                      <CategoryIcon name={cat.icon} className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold truncate">{cat.name}</h3>
                        <Badge variant="secondary" className="shrink-0">{cat.mediaCount}</Badge>
                      </div>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{cat.description}</p>
                      )}
                      {cat.children?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {cat.children.slice(0, 4).map((sub) => (
                            <span
                              key={sub.id}
                              className="text-[10px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground"
                            >
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
        </div>
      </section>

      {/* POPULAR */}
      {popular.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-amber-600" /> Más populares
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Lo más visto de la comunidad</p>
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <MediaCardSkeleton key={i} />)
              : popular.map((m) => <MediaCard key={m.id} media={m} />)}
          </div>
        </section>
      )}

      {/* RECIENTES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-sky-600" /> Añadidos recientemente
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Las imágenes más nuevas del directorio</p>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <MediaCardSkeleton key={i} />)
            : recent.map((m) => <MediaCard key={m.id} media={m} />)}
        </div>
      </section>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <div className="text-xl font-bold leading-none">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="p-5 gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <h3 className="font-semibold mt-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </Card>
  )
}
