'use client'

import { useApp } from '@/stores/app-store'
import { Images, Github, Twitter, Mail } from 'lucide-react'

export function Footer() {
  const { navigate, categories } = useApp()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Images className="h-4 w-4" />
              </div>
              <span className="font-bold">MediaPortal</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Directorio de imágenes, GIFs y vídeos para negocios. Aloja, categoriza y posiciona tus
              archivos multimedia optimizados para buscadores.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Explorar</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button className="hover:text-foreground" onClick={() => navigate({ name: 'home' })}>
                  Inicio
                </button>
              </li>
              <li>
                <button className="hover:text-foreground" onClick={() => navigate({ name: 'pricing' })}>
                  Precios
                </button>
              </li>
              <li>
                <button className="hover:text-foreground" onClick={() => navigate({ name: 'search', q: '' })}>
                  Buscar
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Categorías</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {categories.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <button className="hover:text-foreground" onClick={() => navigate({ name: 'category', categoryId: c.id })}>
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Cuenta</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button className="hover:text-foreground" onClick={() => navigate({ name: 'login' })}>
                  Iniciar sesión
                </button>
              </li>
              <li>
                <button className="hover:text-foreground" onClick={() => navigate({ name: 'login' })}>
                  Crear cuenta gratis
                </button>
              </li>
              <li>
                <button className="hover:text-foreground" onClick={() => navigate({ name: 'pricing' })}>
                  Planes y precios
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground">
          <p>© {year} MediaPortal. Todos los derechos reservados.</p>
          <div className="flex items-center gap-3">
            <button className="hover:text-foreground" aria-label="Twitter">
              <Twitter className="h-4 w-4" />
            </button>
            <button className="hover:text-foreground" aria-label="Github">
              <Github className="h-4 w-4" />
            </button>
            <button className="hover:text-foreground" aria-label="Email">
              <Mail className="h-4 w-4" />
            </button>
          </div>
          <p>$0.10 por imagen · 5 imágenes gratis por categoría</p>
        </div>
      </div>
    </footer>
  )
}
