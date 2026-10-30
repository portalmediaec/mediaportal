import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MediaPortal · Directorio de imágenes y vídeos para negocios",
    template: "%s | MediaPortal",
  },
  description:
    "Portal multimedia para alojar imágenes, GIFs y vídeos organizados por categorías y subcategorías. Optimizado para SEO e indexación. 5 imágenes gratis por categoría, $0.10 por imagen adicional.",
  keywords: [
    "directorio de imágenes",
    "banco de imágenes",
    "hosting multimedia",
    "imágenes SEO",
    "categorías de imágenes",
    "directorio de negocios",
    "imágenes gratis",
    "subir imágenes",
    "GIF",
    "vídeos",
    "MediaPortal",
  ],
  authors: [{ name: "MediaPortal" }],
  creator: "MediaPortal",
  metadataBase: new URL("https://mediaportal.example.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "MediaPortal · Directorio multimedia con SEO",
    description:
      "Aloja, categoriza y posiciona tus imágenes de negocio. Optimizado para buscadores. 5 imágenes gratis por categoría.",
    url: "https://mediaportal.example.com",
    siteName: "MediaPortal",
    locale: "es_EC",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediaPortal · Directorio multimedia con SEO",
    description:
      "Aloja, categoriza y posiciona tus imágenes de negocio. Optimizado para buscadores.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
