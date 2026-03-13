import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/theme-context'
import { SettingsProvider } from '@/lib/settings-context'
import { SessionProvider } from '@/components/providers/session-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BD Intelligence',
  description: 'Life sciences BD intelligence platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <SettingsProvider>
            <SessionProvider>
              {children}
            </SessionProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
