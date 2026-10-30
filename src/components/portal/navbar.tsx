'use client'

import { useState } from 'react'
import { useApp } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ImagePlus,
  LayoutDashboard,
  FolderOpen,
  Wallet,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Menu,
  Search,
  Images,
  CreditCard,
} from 'lucide-react'
import { CategoriesMenu } from './categories-menu'

export function Navbar() {
  const { user, navigate, logout, mobileMenuOpen, setMobileMenu } = useApp()
  const [search, setSearch] = useState('')

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) navigate({ name: 'search', q: search.trim() })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => navigate({ name: 'home' })}
          className="flex items-center gap-2 shrink-0"
          aria-label="Inicio"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Images className="h-5 w-5" />
          </div>
          <div className="hidden sm:block text-left leading-none">
            <span className="block font-bold text-base">MediaPortal</span>
            <span className="block text-[10px] text-muted-foreground">Directorio de imágenes</span>
          </div>
        </button>

        {/* Buscador */}
        <form onSubmit={submitSearch} className="relative flex-1 max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar imágenes, categorías, tags…"
            className="pl-9 h-10"
            aria-label="Buscar"
          />
        </form>

        {/* Nav desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          <CategoriesMenu />
          <Button variant="ghost" size="sm" onClick={() => navigate({ name: 'pricing' })}>
            Precios
          </Button>
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => navigate({ name: 'admin' })}>
                  <ShieldCheck className="h-4 w-4 mr-1.5" /> Admin
                </Button>
              )}
              <Button size="sm" className="hidden sm:flex" onClick={() => navigate({ name: 'upload' })}>
                <ImagePlus className="h-4 w-4 mr-1.5" /> Subir
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                      {(user.name || user.email)[0].toUpperCase()}
                    </span>
                    <span className="hidden md:inline max-w-[120px] truncate">{user.name || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium truncate">{user.name || user.email}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-normal">
                      <CreditCard className="h-3 w-3" />
                      {user.credits} créditos
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ name: 'dashboard' })}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ name: 'my-media' })}>
                    <FolderOpen className="mr-2 h-4 w-4" /> Mis imágenes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ name: 'upload' })}>
                    <ImagePlus className="mr-2 h-4 w-4" /> Subir imágenes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ name: 'credits' })}>
                    <Wallet className="mr-2 h-4 w-4" /> Comprar créditos
                  </DropdownMenuItem>
                  {user.role === 'ADMIN' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate({ name: 'admin' })}>
                        <ShieldCheck className="mr-2 h-4 w-4" /> Backoffice Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ name: 'login' })} className="hidden sm:flex">
                Iniciar sesión
              </Button>
              <Button size="sm" onClick={() => navigate({ name: 'login' })}>
                Crear cuenta
              </Button>
            </>
          )}

          {/* Menú móvil */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenu}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menú">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px]">
              <SheetHeader>
                <SheetTitle>Menú</SheetTitle>
              </SheetHeader>
              <div className="px-4 space-y-4">
                <form onSubmit={submitSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar…"
                    className="pl-9"
                  />
                </form>
                <nav className="flex flex-col gap-1">
                  <MobileLink onClick={() => navigate({ name: 'home' })}>Inicio</MobileLink>
                  <MobileLink onClick={() => navigate({ name: 'pricing' })}>Precios</MobileLink>
                  {user && <MobileLink onClick={() => navigate({ name: 'dashboard' })}>Mi panel</MobileLink>}
                  {user && <MobileLink onClick={() => navigate({ name: 'upload' })}>Subir imágenes</MobileLink>}
                  {user && <MobileLink onClick={() => navigate({ name: 'my-media' })}>Mis imágenes</MobileLink>}
                  {user && <MobileLink onClick={() => navigate({ name: 'credits' })}>Comprar créditos</MobileLink>}
                  {user?.role === 'ADMIN' && (
                    <MobileLink onClick={() => navigate({ name: 'admin' })}>Backoffice Admin</MobileLink>
                  )}
                </nav>
                {!user && (
                  <Button className="w-full" onClick={() => navigate({ name: 'login' })}>
                    Iniciar sesión / Crear cuenta
                  </Button>
                )}
                {user && (
                  <Button variant="outline" className="w-full" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

function MobileLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent text-left"
    >
      {children}
    </button>
  )
}
