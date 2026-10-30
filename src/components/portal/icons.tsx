'use client'

import {
  Store,
  Cpu,
  Plane,
  Shirt,
  Palette,
  Home,
  Image as ImageIcon,
  Film,
  Camera,
  Tag,
  Folder,
  type LucideIcon,
} from 'lucide-react'

const MAP: Record<string, LucideIcon> = {
  Store,
  Cpu,
  Plane,
  Shirt,
  Palette,
  Home,
  Image: ImageIcon,
  Film,
  Camera,
  Tag,
}

const COLOR_MAP: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
}

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && MAP[name]) || Folder
  return <Icon className={className} />
}

export function categoryColor(color?: string | null) {
  return (color && COLOR_MAP[color]) || 'bg-muted text-muted-foreground'
}
