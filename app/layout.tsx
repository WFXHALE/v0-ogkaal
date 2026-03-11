import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { FirebaseProvider } from '@/components/firebase-provider'
import { PageLoader } from '@/components/page-loader'
import './globals.css'

const _inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
})

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'OG KAAL TRADER - Master the Markets',
  description: 'Master the markets with Smart Money Concepts and proven ICT trading strategies. Join thousands of profitable traders.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" />
        <link rel="dns-prefetch" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" />
        
        {/* Prefetch critical navigation pages for instant routing */}
        <link rel="prefetch" href="/" />
        <link rel="prefetch" href="/mentorship" />
        <link rel="prefetch" href="/vip-group" />
        <link rel="prefetch" href="/usdt-p2p" />
        <link rel="prefetch" href="/contact" />
        <link rel="prefetch" href="/material" />
        <link rel="prefetch" href="/dashboard" />
        <link rel="prefetch" href="/performance" />
        <link rel="prefetch" href="/vip-signals" />
        <link rel="prefetch" href="/about" />
        <link rel="prefetch" href="/blog" />
        <link rel="prefetch" href="/smc-guide" />
        
        {/* Optimize rendering */}
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <FirebaseProvider>
          <ThemeProvider>
            <PageLoader />
            {children}
          </ThemeProvider>
        </FirebaseProvider>
        <Analytics />
      </body>
    </html>
  )
}
