'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/stores/app-store'
import { api, type MediaItem, type Category } from '@/lib/api'
import { Seo } from './seo'
import { MediaCard, MediaCardSkeleton } from './media-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Search, ChevronLeft, ImageOff, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_FILTERS = [
  { key: '', label: 'Todo' },
  { key: 'IMAGE', label: 'Imágenes' },
  { key: 'GIF', label: 'GIFs' },
  { key: 'VIDEO', label: 'Vídeos' },
]

export function SearchView({ q, type }: { q: string; type?: string }) {
  const { navigate } = useApp()
  const [query, setQuery] = useState(q)
  const [typeFilter, setTypeFilter] = useState(type || '')
  const [items, setItems] = useState<MediaItem[]>([])
  const [catSuggestions, setCatSuggestions] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)

  useEffect(() => {
    setQuery(q)
    setTypeFilter(type || '')
    setPage(1)
  }, [q, type])

  useEffect(() => {
    if (!q) {
      setItems([])
      setTotal(0)
      return
    }
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await api.search(q, typeFilter || undefined, page)
        if (!active) return
        setItems(res.items)
        setTotal(res.total)
        setPages(res.pages)
        setCatSuggestions(res.categories)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [q, typeFilter, page])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) navigate({ name: 'search', q: query.trim(), type: typeFilter || undefined })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <Seo title={`${q ? `"${q}"` : 'Buscar'} · MediaPortal`} description={`Resultados de búsqueda para "${q}" en el directorio multimedia.`} keywords={q} />

      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate({ name: 'home' })}>
        <ChevronLeft className="h-4 w-4" /> Inicio
      </Button>

      <h1 className="text-2xl font-bold mb-4">Buscar imágenes</h1>

      <form onSubmit={submit} className="relative max-w-2xl mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Escribe tu búsqueda…" className="pl-10 h-11" />
      </form>

      <div className="flex flex-wrap items-center gap-1.5 mb-6">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setTypeFilter(f.key)
              navigate({ name: 'search', q, type: f.key || undefined })
            }}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
              typeFilter === f.key ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {catSuggestions.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Categorías:</span>
          {catSuggestions.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate({ name: 'category', categoryId: c.id })}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:bg-accent"
            >
              <Folder className="h-3 w-3" /> {c.name}
            </button>
          ))}
        </div>
      )}

      {q && (
        <p className="text-sm text-muted-foreground mb-4">
          {loading ? 'Buscando…' : `${total} resultado(s) para “${q}”`}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <MediaCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ImageOff className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            {q ? 'Sin resultados. Prueba con otros términos.' : 'Escribe algo para buscar.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <MediaCard key={m.id} media={m} />
          ))}
        </div>
      )}

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
