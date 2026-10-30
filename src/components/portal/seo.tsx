'use client'

import { useEffect } from 'react'

type Props = {
  title?: string
  description?: string
  keywords?: string
  image?: string
  type?: string
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function Seo({ title, description, keywords, image, type = 'website' }: Props) {
  useEffect(() => {
    if (title) {
      document.title = title
      setMeta('property', 'og:title', title)
      setMeta('name', 'twitter:title', title)
    }
    if (description) {
      setMeta('name', 'description', description)
      setMeta('property', 'og:description', description)
      setMeta('name', 'twitter:description', description)
    }
    if (keywords) setMeta('name', 'keywords', keywords)
    if (image) {
      setMeta('property', 'og:image', image)
      setMeta('name', 'twitter:image', image)
      setMeta('name', 'twitter:card', 'summary_large_image')
    }
    setMeta('property', 'og:type', type)
  }, [title, description, keywords, image, type])

  return null
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  useEffect(() => {
    const id = 'jsonld-dynamic'
    let el = document.getElementById(id) as HTMLScriptElement | null
    if (!el) {
      el = document.createElement('script')
      el.id = id
      el.type = 'application/ld+json'
      document.head.appendChild(el)
    }
    el.textContent = JSON.stringify(data)
  }, [data])
  return null
}
