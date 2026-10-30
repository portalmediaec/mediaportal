'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { useApp } from '@/stores/app-store'
import { CategoryIcon, categoryColor } from './icons'
import { cn } from '@/lib/utils'

export function CategoriesMenu() {
  const { categories, navigate } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          Categorías <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel>Explorar categorías</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {categories.length === 0 && (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">Cargando…</div>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="py-1">
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate({ name: 'category', categoryId: cat.id })}
            >
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-md', categoryColor(cat.color))}>
                <CategoryIcon name={cat.icon} className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{cat.name}</div>
                <div className="text-[10px] text-muted-foreground">{cat.mediaCount} imágenes</div>
              </div>
            </DropdownMenuItem>
            {cat.children?.length > 0 && (
              <div className="ml-9 mt-0.5 mb-1 border-l pl-2">
                {cat.children.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => navigate({ name: 'category', categoryId: cat.id, subcategoryId: sub.id })}
                    className="block w-full text-left px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded"
                  >
                    {sub.name} · {sub.mediaCount}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
