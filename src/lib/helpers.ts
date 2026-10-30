import { randomBytes } from 'crypto'

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function uniqueSlug(base: string): string {
  const suffix = randomBytes(3).toString('hex')
  return `${base}-${suffix}`.slice(0, 80)
}

export function getMediaType(filename: string): 'IMAGE' | 'GIF' | 'VIDEO' {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (['gif'].includes(ext)) return 'GIF'
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'VIDEO'
  return 'IMAGE'
}

export function fileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

export const PRICE_PER_IMAGE = 0.1 // $0.10 por imagen
export const FREE_LIMIT_PER_CATEGORY = 5 // 5 imágenes gratis por categoría

// Formatea moneda en dólares
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value)
}

// Cuenta palabras clave a partir de texto separado por comas
export function parseTags(tags?: string): string[] {
  if (!tags) return []
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}
