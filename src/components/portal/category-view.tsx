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
import { ChevronLeft, ImageOff, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_FILTERS = [
  { key: '', label: 'Todo' },
  { key: 'IMAGE', label: 'Imágenes' },
  { key: 'GIF', label: 'GIFs' },
  { key: 'VIDEO', label: 'Vídeos' },
]
const SORTS = [
  { key: 'recent', label: 'Recientes' },
  { key: 'popular', label: 'Populares' },
  { key: 'oldest', label: 'Antiguas' },
]

export function CategoryView({ categoryId, subcategoryId }: { categoryId: string; subcategoryId?: string }) {
  const { categories, navigate } = useApp()
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [type, setType] = useState('')
  const [sort, setSort] = useState('recent')

  const category = categories.find((c) => c.id === categoryId)
  const sub = category?.children?.find((s) => s.id === subcategoryId)

  useEffect(() => {
    setPage(1)
  }, [categoryId, subcategoryId, type, sort])

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await api.media({ categoryId, subcategoryId, type: type || undefined, sort, page, limit: 24 })
        if (!active) return
        setItems(res.items)
        setPages(res.pages)
        setTotal(res.total)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [categoryId, subcategoryId, type, sort, page])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <Seo
        title={sub ? `${sub.name} · ${category?.name} | MediaPortal` : `${category?.name || 'Categoría'} | MediaPortal`}
        description={sub ? `Imágenes de ${sub.name} en ${category?.name}. ${category?.description || ''}` : category?.description || `Explora imágenes de ${category?.name}.`}
        keywords={category?.name}
        image={items[0]?.thumbnailUrl || items[0]?.url}
      />

      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate({ name: 'home' })}>
        <ChevronLeft className="h-4 w-4" /> Inicio
      </Button>

      {/* Header categoría */}
      <Card className="p-6 mb-6 gap-2">
        <div className="flex items-start gap-4">
          <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl', categoryColor(category?.color))}>
            <CategoryIcon name={category?.icon} className="h-7 w-7" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{category?.name || 'Cargando…'}</h1>
              <Badge variant="secondary">{total} imágenes</Badge>
            </div>
            {category?.description && <p className="text-muted-foreground text-sm mt-1">{category.description}</p>}
          </div>
        </div>

        {/* Subcategorías */}
        {category?.children && category.children.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => navigate({ name: 'category', categoryId })}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                !subcategoryId ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
              )}
            >
              Todas
            </button>
            {category.children.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate({ name: 'category', categoryId, subcategoryId: s.id })}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                  subcategoryId === s.id ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                )}
              >
                {s.name} · {s.mediaCount}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setType(f.key)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                type === f.key ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-1.5">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                  sort === s.key ? 'bg-secondary border-secondary' : 'hover:bg-accent'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <MediaCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ImageOff className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No hay imágenes en esta categoría todavía.</p>
          <Button className="mt-4" onClick={() => navigate({ name: 'login' })}>
            Subir la primera imagen
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <MediaCard key={m.id} media={m} />
          ))}
        </div>
      )}

      {/* Paginación */}
      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Página {page} de {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
