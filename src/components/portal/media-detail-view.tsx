'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/stores/app-store'
import { api, type MediaItem } from '@/lib/api'
import { Seo, JsonLd } from './seo'
import { MediaCard } from './media-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  ChevronLeft,
  Eye,
  ExternalLink,
  Calendar,
  User,
  Folder,
  Tag,
  Search,
  Copy,
} from 'lucide-react'

export function MediaDetailView({ id }: { id: string }) {
  const { navigate, categories } = useApp()
  const [data, setData] = useState<{ media: MediaItem; related: MediaItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await api.mediaDetail(id)
        if (!active) return
        setData(res)
      } catch {
        if (active) setData(null)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  const media = data?.media
  const tags = media?.tags?.split(',').map((t) => t.trim()).filter(Boolean) || []

  const copyLink = () => {
    if (!media) return
    const url = `${window.location.origin}/#/media/${media.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Enlace copiado')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 aspect-video" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (!media) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 text-center">
        <p className="text-muted-foreground">Imagen no encontrada o no disponible.</p>
        <Button className="mt-4" onClick={() => navigate({ name: 'home' })}>
          Volver al inicio
        </Button>
      </div>
    )
  }

  const seoTitle = media.seoTitle || `${media.title} | MediaPortal`
  const seoDescription = media.seoDescription || media.description || `Imagen de ${media.category?.name}: ${media.title}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: media.title,
    description: seoDescription,
    contentUrl: media.url,
    thumbnailUrl: media.thumbnailUrl || media.url,
    caption: media.altText || media.title,
    keywords: media.seoKeywords || media.tags,
    author: media.user?.name ? { '@type': 'Person', name: media.user.name } : undefined,
    datePublished: media.createdAt,
    isPartOf: { '@type': 'CollectionPage', name: media.category?.name },
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <Seo
        title={seoTitle}
        description={seoDescription}
        keywords={media.seoKeywords || media.tags || undefined}
        image={media.thumbnailUrl || media.url}
        type="article"
      />
      <JsonLd data={jsonLd} />

      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => window.history.back()}>
        <ChevronLeft className="h-4 w-4" /> Volver
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Imagen principal */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden p-0">
            <div className="relative bg-muted flex items-center justify-center min-h-[300px]">
              {media.type === 'VIDEO' ? (
                <video src={media.url} controls className="w-full max-h-[70vh] object-contain" />
              ) : (
                <img
                  src={media.url}
                  alt={media.altText || media.title}
                  className="w-full max-h-[70vh] object-contain"
                />
              )}
            </div>
          </Card>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Copy className="h-4 w-4 mr-1.5" />
              {copied ? 'Copiado' : 'Copiar enlace'}
            </Button>
            {media.externalLink && (
              <Button asChild variant="outline" size="sm">
                <a href={media.externalLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1.5" /> Abrir enlace externo
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <a href={media.url} download={`${media.title || 'imagen'}`}>
                Descargar
              </a>
            </Button>
          </div>

          {/* Relacionadas */}
          {data.related.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 mt-2">Imágenes relacionadas</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {data.related.map((m) => (
                  <MediaCard key={m.id} media={m} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar info / SEO */}
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{media.type}</Badge>
              {media.category && (
                <Badge variant="outline" className="cursor-pointer" onClick={() => navigate({ name: 'category', categoryId: media.categoryId })}>
                  <Folder className="h-3 w-3 mr-1" /> {media.category.name}
                </Badge>
              )}
              {media.subcategory && (
                <Badge variant="outline" className="cursor-pointer" onClick={() => navigate({ name: 'category', categoryId: media.categoryId, subcategoryId: media.subcategoryId! })}>
                  {media.subcategory.name}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-bold leading-tight">{media.title}</h1>
            {media.description && <p className="text-sm text-muted-foreground">{media.description}</p>}

            <Separator />

            <dl className="space-y-2 text-sm">
              <InfoRow icon={<Eye className="h-4 w-4" />} label="Vistas" value={media.views} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Subido" value={new Date(media.createdAt).toLocaleDateString('es-EC')} />
              <InfoRow icon={<User className="h-4 w-4" />} label="Por" value={media.user?.name || media.user?.company || 'Anónimo'} />
            </dl>

            {tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                    <Tag className="h-3.5 w-3.5" /> ETIQUETAS
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <button
                        key={t}
                        onClick={() => navigate({ name: 'search', q: t })}
                        className="rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-accent"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Datos SEO */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Search className="h-3.5 w-3.5" /> DATOS SEO (INDEXACIÓN)
            </div>
            <SeoField label="Title SEO" value={seoTitle} />
            <SeoField label="Meta description" value={seoDescription} />
            {media.seoKeywords && <SeoField label="Keywords" value={media.seoKeywords} />}
            {media.altText && <SeoField label="Alt text" value={media.altText} />}
            <SeoField label="URL de la imagen" value={media.url} mono />
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex items-center gap-2 text-muted-foreground">
        {icon} {label}
      </dt>
      <dd className="font-medium text-right truncate max-w-[60%]">{value}</dd>
    </div>
  )
}

function SeoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium">{label}</div>
      <div className={`text-xs text-muted-foreground bg-muted/50 rounded p-2 ${mono ? 'font-mono break-all' : 'line-clamp-3'}`}>
        {value}
      </div>
    </div>
  )
}
