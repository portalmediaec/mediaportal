import { PrismaClient } from '@prisma/client'
import { scryptSync, randomBytes } from 'crypto'

const db = new PrismaClient()

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const IMAGES = [
  { file: 'seed-restaurantes.jpg', title: 'Restaurante gourmet con interior cálido' },
  { file: 'seed-tiendas.jpg', title: 'Tienda minorista moderna' },
  { file: 'seed-gadgets.jpg', title: 'Gadgets tecnológicos sobre escritorio' },
  { file: 'seed-playas.jpg', title: 'Playa tropical paradisíaca al atardecer' },
  { file: 'seed-montanas.jpg', title: 'Cordillera montañosa con nieve' },
  { file: 'seed-ciudades.jpg', title: 'Ciudad cosmopolita iluminada de noche' },
  { file: 'seed-ropa.jpg', title: 'Ropa de moda sobre fondo neutro' },
  { file: 'seed-accesorios.jpg', title: 'Accesorios de cuero elegantes' },
  { file: 'seed-ilustraciones.jpg', title: 'Ilustración digital colorida' },
  { file: 'seed-fotografia.jpg', title: 'Fotografía artística en blanco y negro' },
  { file: 'seed-casas.jpg', title: 'Casa familiar con jardín amplio' },
  { file: 'seed-apartamentos.jpg', title: 'Apartamento moderno con vistas' },
]

async function main() {
  console.log('Limpiando base de datos...')
  await db.media.deleteMany()
  await db.payment.deleteMany()
  await db.category.deleteMany()
  await db.user.deleteMany()

  console.log('Creando admin...')
  const admin = await db.user.create({
    data: {
      email: 'admin@mediaportal.com',
      name: 'Administrador',
      passwordHash: hashPassword('admin123'),
      role: 'ADMIN',
      credits: 100,
      company: 'MediaPortal',
    },
  })

  const demoUser = await db.user.create({
    data: {
      email: 'usuario@demo.com',
      name: 'Usuario Demo',
      passwordHash: hashPassword('demo123'),
      role: 'USER',
      credits: 20,
      company: 'Demo Studio',
      website: 'https://demo.com',
    },
  })

  console.log('Creando categorías...')
  const cats = [
    { name: 'Negocios', icon: 'Store', color: 'amber', sub: ['Restaurantes', 'Tiendas', 'Servicios'] },
    { name: 'Tecnología', icon: 'Cpu', color: 'emerald', sub: ['Gadgets', 'Software'] },
    { name: 'Viajes y Turismo', icon: 'Plane', color: 'sky', sub: ['Playas', 'Montañas', 'Ciudades'] },
    { name: 'Moda', icon: 'Shirt', color: 'pink', sub: ['Ropa', 'Accesorios'] },
    { name: 'Arte y Diseño', icon: 'Palette', color: 'violet', sub: ['Ilustraciones', 'Fotografía'] },
    { name: 'Inmobiliaria', icon: 'Home', color: 'orange', sub: ['Casas', 'Apartamentos'] },
  ]

  const subByName = new Map<string, { id: string; name: string }>()
  for (const c of cats) {
    const parent = await db.category.create({
      data: {
        name: c.name,
        slug: slugify(c.name),
        description: `Imágenes y recursos multimedia de ${c.name.toLowerCase()} para tu directorio de negocios.`,
        icon: c.icon,
        color: c.color,
        parentId: null,
      },
    })
    for (const s of c.sub) {
      const sub = await db.category.create({
        data: { name: s, slug: slugify(s), parentId: parent.id, icon: c.icon, color: c.color },
      })
      subByName.set(s, { id: sub.id, name: sub.name })
    }
  }

  console.log('Creando media de ejemplo...')
  const keywordsByCat: Record<string, string> = {
    Restaurantes: 'restaurante, comida, gastronomía, interior',
    Tiendas: 'tienda, retail, compras, productos',
    Gadgets: 'tecnología, gadgets, electrónica, dispositivos',
    Playas: 'playa, mar, vacaciones, paraíso, tropical',
    Montañas: 'montaña, nieve, naturaleza, aventura',
    Ciudades: 'ciudad, urbano, rascacielos,夜景',
    Ropa: 'moda, ropa, estilo, vestuario',
    Accesorios: 'accesorios, cuero, complementos, moda',
    Ilustraciones: 'ilustración, arte digital, diseño, color',
    Fotografía: 'fotografía, arte, blanco y negro, retrato',
    Casas: 'casa, hogar, familia, jardín, propiedad',
    Apartamentos: 'apartamento, moderno, vivienda, inmobiliaria',
  }

  let i = 0
  for (const img of IMAGES) {
    const subName = img.title.split(' ')[0]
    const cat = subName.replace(/[^a-záéíóú]/gi, '').toLowerCase()
    // mapeo simple basado en el archivo
    const mapping: Record<string, { sub: string; catName: string }> = {
      restaurantes: { sub: 'Restaurantes', catName: 'Negocios' },
      tiendas: { sub: 'Tiendas', catName: 'Negocios' },
      gadgets: { sub: 'Gadgets', catName: 'Tecnología' },
      playas: { sub: 'Playas', catName: 'Viajes y Turismo' },
      montanas: { sub: 'Montañas', catName: 'Viajes y Turismo' },
      ciudades: { sub: 'Ciudades', catName: 'Viajes y Turismo' },
      ropa: { sub: 'Ropa', catName: 'Moda' },
      accesorios: { sub: 'Accesorios', catName: 'Moda' },
      ilustraciones: { sub: 'Ilustraciones', catName: 'Arte y Diseño' },
      fotografia: { sub: 'Fotografía', catName: 'Arte y Diseño' },
      casas: { sub: 'Casas', catName: 'Inmobiliaria' },
      apartamentos: { sub: 'Apartamentos', catName: 'Inmobiliaria' },
    }
    const key = img.file.replace('seed-', '').replace('.jpg', '')
    const m = mapping[key] || { sub: 'Restaurantes', catName: 'Negocios' }
    const sub = subByName.get(m.sub)
    if (!sub) continue
    const parent = await db.category.findFirst({ where: { name: m.catName } })
    const seoKeywords = keywordsByCat[m.sub] || ''
    await db.media.create({
      data: {
        title: img.title,
        slug: `${slugify(img.title)}-${i}`,
        description: `${img.title}. Recurso multimedia optimizado para SEO dentro del directorio de ${m.catName.toLowerCase()}. Ideal para campañas, portfolios y catálogos de negocios.`,
        url: `/uploads/${img.file}`,
        thumbnailUrl: `/uploads/${img.file}`,
        type: 'IMAGE',
        altText: img.title,
        seoTitle: `${img.title} | ${m.catName} - MediaPortal`,
        seoDescription: `Descarga y usa "${img.title}". Imagen categorizada en ${m.sub} (${m.catName}) con licencia para uso comercial en directorios de negocios.`,
        seoKeywords,
        tags: seoKeywords,
        categoryId: parent!.id,
        subcategoryId: sub.id,
        userId: i % 3 === 0 ? admin.id : demoUser.id,
        status: 'APPROVED',
        views: Math.floor(Math.random() * 500),
      },
    })
    i++
  }

  console.log('Seed completado.')
  console.log('Admin: admin@mediaportal.com / admin123')
  console.log('Usuario: usuario@demo.com / demo123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
