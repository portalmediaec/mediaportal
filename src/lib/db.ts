import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// ─── Inicialización temprana de variables ───
// Prisma requiere DATABASE_URL en el schema, pero en producción usamos Turso.
// Si DATABASE_URL no está definida, la derivamos de las variables de Turso
// para que Prisma pueda inicializarse (aunque luego usemos el adapter).
if (!process.env.DATABASE_URL) {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN
  if (tursoUrl && tursoToken) {
    process.env.DATABASE_URL = `${tursoUrl}?authToken=${tursoToken}`
  } else {
    // Fallback para desarrollo local sin Turso
    process.env.DATABASE_URL = 'file:./db/local.db'
  }
}

// Detecta si estamos en Turso/libSQL (production) o SQLite local (development)
function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (tursoUrl && tursoToken) {
    // Producción: Turso (libSQL) via driver adapter
    const adapter = new PrismaLibSql({ url: tursoUrl, authToken: tursoToken })
    return new PrismaClient({ adapter })
  }

  // Desarrollo local: SQLite
  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['warn', 'error'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
