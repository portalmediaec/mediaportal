// Cliente API para el frontend (client-side)
import type { AppStore } from '@/stores/app-store'

export type Category = {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  color?: string | null
  parentId?: string | null
  mediaCount: number
  children: Category[]
}

export type MediaItem = {
  id: string
  title: string
  slug: string
  description?: string | null
  url: string
  thumbnailUrl?: string | null
  type: string
  externalLink?: string | null
  altText?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
  tags?: string | null
  status: string
  views: number
  categoryId: string
  subcategoryId?: string | null
  userId: string
  createdAt: string
  category?: { id: string; name: string; slug: string }
  subcategory?: { id: string; name: string; slug: string } | null
  user?: { id: string; name: string | null; company: string | null }
}

export type User = {
  id: string
  email: string
  name: string | null
  role: string
  credits: number
  company?: string | null
  website?: string | null
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Error ${res.status}`
    const err = new Error(msg) as Error & { status: number; kind?: string }
    err.status = res.status
    err.kind = data?.kind
    throw err
  }
  return data as T
}

function requestForm<T>(url: string, form: FormData, method = 'POST'): Promise<T> {
  return fetch(url, { method, body: form }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || `Error ${res.status}`
      const err = new Error(msg) as Error & { status: number; kind?: string }
      err.status = res.status
      err.kind = data?.kind
      throw err
    }
    return data as T
  })
}

export const api = {
  // auth
  me: () => request<{ user: User | null }>('/api/auth/me'),
  login: (email: string, password: string) =>
    request<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: { email: string; password: string; name?: string; company?: string; website?: string }) =>
    request<{ user: User }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  // categories
  categories: () => request<{ categories: Category[] }>('/api/categories'),
  createCategory: (data: Record<string, unknown>) =>
    request<{ category: Category }>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Record<string, unknown>) =>
    request<{ category: Category }>(`/api/categories?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request(`/api/categories?id=${id}`, { method: 'DELETE' }),

  // media
  media: (params: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v !== undefined && sp.set(k, String(v)))
    return request<{ items: MediaItem[]; total: number; page: number; pages: number; limit: number }>(`/api/media?${sp}`)
  },
  mediaDetail: (id: string) =>
    request<{ media: MediaItem; related: MediaItem[] }>(`/api/media/${id}`),
  updateMedia: (id: string, data: Record<string, unknown>) =>
    request<{ media: MediaItem }>(`/api/media/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedia: (id: string) => request(`/api/media/${id}`, { method: 'DELETE' }),
  uploadSingle: (form: FormData) => requestForm<{ media: MediaItem }>('/api/media', form, 'POST'),
  uploadMass: (form: FormData) =>
    requestForm<{ uploaded: number; media: MediaItem[]; freeUsed: number; paidUsed: number; credits: number; message: string }>('/api/upload-media', form, 'POST'),
  uploadBudget: (categoryId: string) =>
    request<{ freeRemaining: number; creditsAvailable: number; freeLimitPerCategory: number; pricePerImage: number }>(`/api/upload-media?categoryId=${categoryId}`),

  // search
  search: (q: string, type?: string, page = 1) => {
    const sp = new URLSearchParams({ q, page: String(page) })
    if (type) sp.set('type', type)
    return request<{ items: MediaItem[]; total: number; pages: number; categories: Category[] }>(`/api/search?${sp}`)
  },

  // payments
  payments: () => request<{ payments: Array<Record<string, unknown>>; credits: number }>('/api/payments'),
  purchaseCredits: (imagesCount: number) =>
    request<{ payment: Record<string, unknown>; credits: number }>('/api/payments', { method: 'POST', body: JSON.stringify({ imagesCount }) }),

  // paypal
  paypalConfig: () => request<{ enabled: boolean; clientId: string }>('/api/paypal/config'),
  paypalCreateOrder: (imagesCount: number) =>
    request<{ orderID: string; status: string; amount: number; imagesCount: number }>('/api/paypal/create-order', { method: 'POST', body: JSON.stringify({ imagesCount }) }),
  paypalCaptureOrder: (orderID: string) =>
    request<{ ok: boolean; payment: Record<string, unknown>; credits: number; imagesCount: number; alreadyProcessed?: boolean }>('/api/paypal/capture-order', { method: 'POST', body: JSON.stringify({ orderID }) }),

  // my (usuario actual)
  myStats: () =>
    request<{ stats: Record<string, number>; recentMedia: MediaItem[]; usageByCategory: Array<Record<string, unknown>>; payments: Array<Record<string, unknown>>; pricePerImage: number; freeLimitPerCategory: number }>('/api/my/stats'),
  myMedia: (search?: string, page = 1) => {
    const sp = new URLSearchParams({ page: String(page) })
    if (search) sp.set('search', search)
    return request<{ items: MediaItem[]; total: number; page: number; pages: number }>(`/api/my/media?${sp}`)
  },

  // admin
  adminStats: () => request<Record<string, unknown>>('/api/admin/stats'),
  adminUsers: (search?: string) =>
    request<{ users: Array<Record<string, unknown>> }>(`/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  adminUpdateUser: (id: string, data: Record<string, unknown>) =>
    request<{ user: User }>('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ id, ...data }) }),
  adminDeleteUser: (id: string) => request(`/api/admin/users?id=${id}`, { method: 'DELETE' }),
  adminMedia: (params: { status?: string; search?: string; page?: number }) => {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v && sp.set(k, String(v)))
    return request<{ items: MediaItem[]; total: number; pages: number }>(`/api/admin/media?${sp}`)
  },
  adminModerate: (id: string, status: string) =>
    request<{ media: MediaItem }>('/api/admin/media', { method: 'PATCH', body: JSON.stringify({ id, status }) }),
}

export type Api = typeof api
export type { AppStore }
