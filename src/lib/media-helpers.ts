// Helpers de subida de media compartidos entre rutas
import { db } from './db'
import { fileExtension, FREE_LIMIT_PER_CATEGORY, PRICE_PER_IMAGE } from './helpers'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'

// Guarda un archivo subido en /public/uploads y devuelve su URL y metadatos
export async function saveFile(file: File): Promise<{ url: string; filename: string; size: number; ext: string }> {
  const ext = fileExtension(file.name) || 'bin'
  const buf = Buffer.from(await file.arrayBuffer())
  const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`
  const dir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, name), buf)
  return { url: `/uploads/${name}`, filename: name, size: buf.length, ext }
}

// Calcula cuántas imágenes son gratis y cuántas requieren créditos
export async function computeUploadBudget(userId: string, categoryId: string, incoming: number) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return { ok: false as const, error: 'Usuario no encontrado' }

  const existing = await db.media.count({ where: { userId, categoryId, status: { not: 'REJECTED' } } })
  const freeRemaining = Math.max(0, FREE_LIMIT_PER_CATEGORY - existing)
  const freeUsed = Math.min(incoming, freeRemaining)
  const paidUsed = incoming - freeUsed
  const creditsNeeded = paidUsed

  if (paidUsed > 0 && user.credits < creditsNeeded) {
    return {
      ok: false as const,
      error: `Necesitas ${creditsNeeded} crédito(s) para subir ${paidUsed} imagen(es) extra en esta categoría. Tienes ${user.credits}. Precio: $${PRICE_PER_IMAGE} por imagen.`,
      creditsNeeded,
      creditsAvailable: user.credits,
      freeRemaining,
    }
  }
  return { ok: true as const, freeUsed, paidUsed, creditsNeeded, creditsAvailable: user.credits, freeRemaining }
}
