import type { Metadata, Viewport } from 'next'
import { Roboto_Mono, Roboto } from 'next/font/google'
import './globals.css'
import { SettingsProvider } from '@/contexts/SettingsContext'

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
})

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'Stellar Invaders | Classic Space Invaders Game',
  description:
    'A classic Space Invaders tribute with authentic formation-based gameplay. Defend Earth against waves of invaders!',
  keywords: [
    'space invaders',
    'arcade game',
    'retro game',
    'browser game',
    'shooting game',
    'stellar',
  ],
  authors: [{ name: 'Stellar Games' }],
  openGraph: {
    title: 'Stellar Invaders',
    description:
      'A classic Space Invaders tribute with authentic formation-based gameplay.',
    type: 'website',
    siteName: 'Stellar Invaders',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stellar Invaders',
    description:
      'A classic Space Invaders tribute with authentic formation-based gameplay.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} ${robotoMono.variable} antialiased bg-[#0a0a1a] overflow-hidden`}
      >
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  )
}
