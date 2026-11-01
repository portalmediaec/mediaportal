import { NextResponse } from 'next/server'

// Endpoint temporal de diagnóstico para ver qué variables llegan al runtime
export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    hasTursoUrl: Boolean(process.env.TURSO_DATABASE_URL),
    hasTursoToken: Boolean(process.env.TURSO_AUTH_TOKEN),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasAuthSecret: Boolean(process.env.AUTH_SECRET),
    tursoUrlPrefix: process.env.TURSO_DATABASE_URL?.slice(0, 30) || null,
    databaseUrlPrefix: process.env.DATABASE_URL?.slice(0, 30) || null,
  })
}
