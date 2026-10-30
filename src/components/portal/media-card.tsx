'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, ExternalLink, Play } from 'lucide-react'
import { useApp } from '@/stores/app-store'
import type { MediaItem } from '@/lib/api'
import { cn } from '@/lib/utils'

export function MediaCard({ media, className }: { media: MediaItem; className?: string }) {
  const navigate = useApp((s) => s.navigate)
  const isVideo = media.type === 'VIDEO'

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => navigate({ name: 'media', id: media.id })}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate({ name: 'media', id: media.id })
      }}
      className={cn(
        'group overflow-hidden p-0 gap-0 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={media.thumbnailUrl || media.url}
          alt={media.altText || media.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur text-[10px] uppercase tracking-wide">
            {media.type}
          </Badge>
        </div>
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-background/80 p-3 backdrop-blur">
              <Play className="h-5 w-5 fill-foreground" />
            </div>
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] backdrop-blur">
          <Eye className="h-3 w-3" />
          {media.views}
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-medium text-sm line-clamp-1 leading-tight" title={media.title}>
          {media.title}
        </h3>
        {media.category && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{media.category.name}</span>
            {media.subcategory && (
              <>
                <span className="text-muted-foreground/50">/</span>
                <span className="truncate">{media.subcategory.name}</span>
              </>
            )}
          </div>
        )}
        {media.externalLink && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <ExternalLink className="h-3 w-3" /> Enlace externo
          </div>
        )}
      </div>
    </Card>
  )
}

export function MediaCardSkeleton() {
  return (
    <Card className="overflow-hidden p-0 gap-0">
      <div className="aspect-[4/3] bg-muted animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
      </div>
    </Card>
  )
}
