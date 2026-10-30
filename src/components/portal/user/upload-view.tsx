'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useApp, type Route } from '@/stores/app-store'
import { api } from '@/lib/api'
import { BackofficeLayout } from '../backoffice-layout'
import { Seo } from '../seo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  ImagePlus,
  FolderOpen,
  Wallet,
  UploadCloud,
  X,
  FileImage,
  AlertCircle,
  CheckCircle2,
  Gift,
  CreditCard,
} from 'lucide-react'

const NAV: { label: string; route: Route; icon: React.ReactNode }[] = [
  { label: 'Panel', route: { name: 'dashboard' }, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Subir imágenes', route: { name: 'upload' }, icon: <ImagePlus className="h-4 w-4" /> },
  { label: 'Mis imágenes', route: { name: 'my-media' }, icon: <FolderOpen className="h-4 w-4" /> },
  { label: 'Comprar créditos', route: { name: 'credits' }, icon: <Wallet className="h-4 w-4" /> },
]

export function UploadView() {
  const { user, navigate, refreshUser, categories } = useApp()
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [description, setDescription] = useState('')
  const [externalLink, setExternalLink] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [tags, setTags] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [budget, setBudget] = useState<{ freeRemaining: number; creditsAvailable: number; freeLimitPerCategory: number; pricePerImage: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!categoryId) {
        if (active) setBudget(null)
        return
      }
      try {
        const b = await api.uploadBudget(categoryId)
        if (active) setBudget(b)
      } catch {
        if (active) setBudget(null)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [categoryId, uploading])

  const subcategories = categories.find((c) => c.id === categoryId)?.children || []

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))
    setFiles((prev) => [...prev, ...arr])
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const canUpload = categoryId && files.length > 0 && !uploading

  const submit = async () => {
    if (!categoryId || files.length === 0) return
    setUploading(true)
    setProgress(0)
    try {
      // Simular progreso
      const timer = setInterval(() => setProgress((p) => Math.min(90, p + 10)), 200)

      const form = new FormData()
      form.append('categoryId', categoryId)
      if (subcategoryId) form.append('subcategoryId', subcategoryId)
      if (description) form.append('description', description)
      if (externalLink) form.append('externalLink', externalLink)
      if (seoKeywords) form.append('seoKeywords', seoKeywords)
      if (tags) form.append('tags', tags)
      files.forEach((f) => form.append('files', f))

      const res = await api.uploadMass(form)
      clearInterval(timer)
      setProgress(100)

      await refreshUser()
      toast.success(res.message)

      // limpiar
      setFiles([])
      setDescription('')
      setExternalLink('')
      setSeoKeywords('')
      setTags('')
      setTimeout(() => {
        setUploading(false)
        setProgress(0)
        navigate({ name: 'my-media' })
      }, 1200)
    } catch (err) {
      const e = err as Error & { status?: number; kind?: string }
      setUploading(false)
      setProgress(0)
      if (e.kind === 'credits' || e.status === 402) {
        toast.error(e.message)
      } else {
        toast.error(e.message)
      }
    }
  }

  if (!user) {
    navigate({ name: 'login' })
    return null
  }

  // cálculo de costo
  const freeRemaining = budget?.freeRemaining ?? 0
  const creditsAvailable = budget?.creditsAvailable ?? user.credits
  const paidCount = Math.max(0, files.length - freeRemaining)
  const cost = paidCount * (budget?.pricePerImage ?? 0.1)

  return (
    <BackofficeLayout title="Mi cuenta" description="Sube tus imágenes" items={NAV} activeRoute="upload">
      <Seo title="Subir imágenes | MediaPortal" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImagePlus className="h-6 w-6" /> Subir imágenes
          </h1>
          <p className="text-muted-foreground text-sm">Subida masiva con metadatos SEO</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="space-y-4">
            {/* Categoría */}
            <Card className="p-5 space-y-3">
              <Label>Categoría *</Label>
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategoryId('') }}>
                <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.mediaCount})</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {subcategories.length > 0 && (
                <>
                  <Label>Subcategoría (opcional)</Label>
                  <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                    <SelectTrigger><SelectValue placeholder="Sin subcategoría" /></SelectTrigger>
                    <SelectContent>
                      {subcategories.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.mediaCount})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </Card>

            {/* Metadatos comunes */}
            <Card className="p-5 space-y-3">
              <div className="text-sm font-medium">Metadatos comunes (aplican a todos los archivos)</div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descripción</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción general de estas imágenes…" rows={2} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Enlace externo</Label>
                  <Input value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="https://…" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tags</Label>
                  <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2, tag3" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Palabras clave SEO</Label>
                <Input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} placeholder="keyword1, keyword2…" />
              </div>
            </Card>
          </div>

          {/* Dropzone + presupuesto */}
          <div className="space-y-4">
            <Card className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Gift className="h-3.5 w-3.5" /> GRATIS RESTANTES
                  </div>
                  <div className="text-xl font-bold mt-1">{freeRemaining}</div>
                  <div className="text-[10px] text-muted-foreground">en esta categoría</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <CreditCard className="h-3.5 w-3.5" /> CRÉDITOS
                  </div>
                  <div className="text-xl font-bold mt-1">{creditsAvailable}</div>
                  <div className="text-[10px] text-muted-foreground">disponibles</div>
                </div>
              </div>
            </Card>

            {/* Dropzone */}
            <Card
              className={`p-8 border-2 border-dashed transition-colors cursor-pointer ${
                dragOver ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
              }`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className="flex flex-col items-center text-center gap-3 py-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-medium">Arrastra tus archivos aquí</p>
                  <p className="text-sm text-muted-foreground">o haz clic para seleccionar · imágenes, GIFs y vídeos</p>
                </div>
                <Button variant="outline" size="sm">Seleccionar archivos</Button>
              </div>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </Card>

            {/* Lista de archivos */}
            {files.length > 0 && (
              <Card className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-md border p-2">
                    <FileImage className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{f.name}</div>
                      <div className="text-[10px] text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</div>
                    </div>
                    {i >= freeRemaining && (
                      <Badge variant="secondary" className="text-amber-600">$0.10</Badge>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); removeFile(i) }} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </Card>
            )}

            {/* Resumen de costo */}
            {files.length > 0 && (
              <Card className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Total archivos</span>
                  <span className="font-medium">{files.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1"><Gift className="h-3.5 w-3.5" /> Gratis</span>
                  <span className="font-medium">{Math.min(files.length, freeRemaining)}</span>
                </div>
                {paidCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" /> De pago</span>
                    <span className="font-medium">{paidCount} = ${cost.toFixed(2)}</span>
                  </div>
                )}
                {paidCount > 0 && paidCount > creditsAvailable && (
                  <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      No tienes suficientes créditos. Necesitas {paidCount} pero tienes {creditsAvailable}.
                      <button className="underline ml-1" onClick={() => navigate({ name: 'credits' })}>Comprar créditos</button>
                    </span>
                  </div>
                )}
              </Card>
            )}

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground text-center">Subiendo… {progress}%</p>
              </div>
            )}

            <Button className="w-full" disabled={!canUpload || (paidCount > 0 && paidCount > creditsAvailable)} onClick={submit}>
              {uploading ? 'Subiendo…' : `Subir ${files.length || ''} imagen(es)`}
            </Button>
          </div>
        </div>
      </div>
    </BackofficeLayout>
  )
}
