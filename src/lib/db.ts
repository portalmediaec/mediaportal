import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// Detecta si estamos en Turso/libSQL (production) o SQLite local (development)
// Turso se activa cuando TURSO_DATABASE_URL y TURSO_AUTH_TOKEN están definidos
function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (tursoUrl && tursoToken) {
    // Producción: Turso (libSQL) via driver adapter
    const adapter = new PrismaLibSql({ url: tursoUrl, authToken: tursoToken })
    return new PrismaClient({ adapter })
  }

  // Desarrollo local: SQLite (aseguramos que DATABASE_URL tenga un valor)
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./db/local.db'
  }
  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['warn', 'error'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
