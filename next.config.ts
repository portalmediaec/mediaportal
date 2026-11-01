import type { NextConfig } from "next";

// Si tenemos TURSO_DATABASE_URL pero no DATABASE_URL, derivamos DATABASE_URL
// automáticamente para que Prisma (que la requiere en el schema) no falle.
// En runtime, el adapter de Turso maneja la conexión real.
if (!process.env.DATABASE_URL && process.env.TURSO_DATABASE_URL) {
  const token = process.env.TURSO_AUTH_TOKEN || '';
  process.env.DATABASE_URL = `${process.env.TURSO_DATABASE_URL}?authToken=${token}`;
}

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
