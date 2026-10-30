'use client'

import { useApp } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'

type NavItem = { label: string; route: Parameters<ReturnType<typeof useApp.getState>['navigate']>[0]; icon: React.ReactNode; badge?: React.ReactNode }

export function BackofficeLayout({
  title,
  description,
  items,
  activeRoute,
  children,
}: {
  title: string
  description?: string
  items: NavItem[]
  activeRoute: string
  children: React.ReactNode
}) {
  const { navigate, user } = useApp()

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate({ name: 'home' })}>
        <ChevronLeft className="h-4 w-4" /> Inicio
      </Button>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start space-y-1">
          <div className="px-3 pb-2 mb-2">
            <h2 className="font-semibold text-sm">{title}</h2>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          {items.map((item, i) => {
            const isActive = item.route.name === activeRoute
            return (
              <button
                key={i}
                onClick={() => navigate(item.route)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors text-left',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                )}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge}
              </button>
            )
          })}
          {user && (
            <div className="mt-4 rounded-md border p-3 text-xs text-muted-foreground">
              <div className="font-medium text-foreground truncate">{user.name || user.email}</div>
              <div className="mt-1">{user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}</div>
              <div className="mt-2 flex items-center justify-between">
                <span>Créditos</span>
                <Badge variant="secondary">{user.credits}</Badge>
              </div>
            </div>
          )}
        </aside>

        {/* Contenido */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
