'use client'

import { useEffect } from 'react'
import { useApp } from '@/stores/app-store'
import { Navbar } from './navbar'
import { Footer } from './footer'
import { HomeView } from './home-view'
import { CategoryView } from './category-view'
import { MediaDetailView } from './media-detail-view'
import { SearchView } from './search-view'
import { AuthView } from './auth-view'
import { PricingView } from './pricing-view'
import { DashboardView } from './user/dashboard-view'
import { UploadView } from './user/upload-view'
import { MyMediaView } from './user/my-media-view'
import { CreditsView } from './user/credits-view'
import { AdminDashboard } from './admin/admin-dashboard'
import { AdminCategories } from './admin/admin-categories'
import { AdminUsers } from './admin/admin-users'
import { AdminMedia } from './admin/admin-media'

const PROTECTED = new Set(['dashboard', 'upload', 'my-media', 'credits', 'admin', 'admin-categories', 'admin-users', 'admin-media'])

export function AppShell() {
  const { route, user, userLoading, init } = useApp()

  useEffect(() => {
    init()
  }, [init])

  // Guard: rutas protegidas requieren login
  useEffect(() => {
    if (userLoading) return
    if (PROTECTED.has(route.name) && !user) {
      useApp.getState().navigate({ name: 'login' })
    }
  }, [route, user, userLoading])

  const renderView = () => {
    switch (route.name) {
      case 'home':
        return <HomeView />
      case 'category':
        return <CategoryView categoryId={route.categoryId} subcategoryId={route.subcategoryId} />
      case 'media':
        return <MediaDetailView id={route.id} />
      case 'search':
        return <SearchView q={route.q} type={route.type} />
      case 'login':
        return <AuthView />
      case 'pricing':
        return <PricingView />
      case 'dashboard':
        return <DashboardView />
      case 'upload':
        return <UploadView />
      case 'my-media':
        return <MyMediaView />
      case 'credits':
        return <CreditsView />
      case 'admin':
        return <AdminDashboard />
      case 'admin-categories':
        return <AdminCategories />
      case 'admin-users':
        return <AdminUsers />
      case 'admin-media':
        return <AdminMedia />
      default:
        return <HomeView />
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{renderView()}</main>
      <Footer />
    </div>
  )
}
