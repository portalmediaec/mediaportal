'use client'

import { create } from 'zustand'
import { api, type User, type Category } from '@/lib/api'

export type Route =
  | { name: 'home' }
  | { name: 'category'; categoryId: string; subcategoryId?: string }
  | { name: 'media'; id: string }
  | { name: 'search'; q: string; type?: string }
  | { name: 'login' }
  | { name: 'dashboard' }
  | { name: 'upload' }
  | { name: 'my-media' }
  | { name: 'credits' }
  | { name: 'pricing' }
  | { name: 'admin' }
  | { name: 'admin-categories' }
  | { name: 'admin-users' }
  | { name: 'admin-media' }

function routeToHash(r: Route): string {
  switch (r.name) {
    case 'home':
      return '#/'
    case 'category': {
      const params = new URLSearchParams()
      if (r.subcategoryId) params.set('sub', r.subcategoryId)
      return `#/category/${r.categoryId}${params.toString() ? `?${params}` : ''}`
    }
    case 'media':
      return `#/media/${r.id}`
    case 'search': {
      const params = new URLSearchParams({ q: r.q })
      if (r.type) params.set('type', r.type)
      return `#/search?${params}`
    }
    case 'login':
      return '#/login'
    case 'dashboard':
      return '#/dashboard'
    case 'upload':
      return '#/upload'
    case 'my-media':
      return '#/my-media'
    case 'credits':
      return '#/credits'
    case 'pricing':
      return '#/pricing'
    case 'admin':
      return '#/admin'
    case 'admin-categories':
      return '#/admin/categories'
    case 'admin-users':
      return '#/admin/users'
    case 'admin-media':
      return '#/admin/media'
  }
}

function hashToRoute(hash: string): Route {
  const h = hash.replace(/^#\/?/, '')
  if (!h || h === '') return { name: 'home' }
  const [path, queryStr] = h.split('?')
  const parts = path.split('/')
  const head = parts[0]
  const params = new URLSearchParams(queryStr || '')

  switch (head) {
    case 'category':
      if (parts[1]) return { name: 'category', categoryId: parts[1], subcategoryId: params.get('sub') || undefined }
      return { name: 'home' }
    case 'media':
      if (parts[1]) return { name: 'media', id: parts[1] }
      return { name: 'home' }
    case 'search':
      return { name: 'search', q: params.get('q') || '', type: params.get('type') || undefined }
    case 'login':
      return { name: 'login' }
    case 'dashboard':
      return { name: 'dashboard' }
    case 'upload':
      return { name: 'upload' }
    case 'my-media':
      return { name: 'my-media' }
    case 'credits':
      return { name: 'credits' }
    case 'pricing':
      return { name: 'pricing' }
    case 'admin':
      if (parts[1] === 'categories') return { name: 'admin-categories' }
      if (parts[1] === 'users') return { name: 'admin-users' }
      if (parts[1] === 'media') return { name: 'admin-media' }
      return { name: 'admin' }
    default:
      return { name: 'home' }
  }
}

type AppState = {
  user: User | null
  userLoading: boolean
  categories: Category[]
  categoriesLoading: boolean
  route: Route
  mobileMenuOpen: boolean

  init: () => Promise<void>
  refreshUser: () => Promise<void>
  refreshCategories: () => Promise<void>
  navigate: (r: Route) => void
  setMobileMenu: (open: boolean) => void
  logout: () => Promise<void>
}

export const useApp = create<AppState>((set, get) => ({
  user: null,
  userLoading: true,
  categories: [],
  categoriesLoading: true,
  route: typeof window !== 'undefined' ? hashToRoute(window.location.hash) : { name: 'home' },
  mobileMenuOpen: false,

  init: async () => {
    const onHash = () => {
      set({ route: hashToRoute(window.location.hash), mobileMenuOpen: false })
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
    window.addEventListener('hashchange', onHash)
    if (!window.location.hash) window.location.hash = '#/'

    get().refreshUser()
    get().refreshCategories()
  },

  refreshUser: async () => {
    set({ userLoading: true })
    try {
      const { user } = await api.me()
      set({ user, userLoading: false })
    } catch {
      set({ user: null, userLoading: false })
    }
  },

  refreshCategories: async () => {
    set({ categoriesLoading: true })
    try {
      const { categories } = await api.categories()
      set({ categories, categoriesLoading: false })
    } catch {
      set({ categoriesLoading: false })
    }
  },

  navigate: (r) => {
    window.location.hash = routeToHash(r)
  },

  setMobileMenu: (open) => set({ mobileMenuOpen: open }),

  logout: async () => {
    await api.logout()
    set({ user: null })
    get().navigate({ name: 'home' })
  },
}))
