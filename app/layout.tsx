import './globals.css'
import { Noto_Sans } from 'next/font/google'
import type { Metadata } from 'next'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'
import Script from 'next/script'

const noto = Noto_Sans({ 
  weight: ['400', '500', '700'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Sayih AI | Dubai Tourism Assistant',
  description: 'Your personal AI guide to experiencing Dubai',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={noto.className}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
} 