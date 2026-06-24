import type { Metadata } from 'next'
import { Shippori_Mincho, Noto_Sans_JP } from 'next/font/google'
import './globals.css'

const mincho = Shippori_Mincho({
  weight: ['500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-mincho',
  display: 'swap',
})

const sans = Noto_Sans_JP({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-sans-jp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'KU Lacrosse Scouting',
  description: '関西大学ラクロス部 スカウティングシステム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${mincho.variable} ${sans.variable}`}>
      <body className="min-h-screen" style={{ background: '#0a1430' }}>
        <header style={{ background: '#0d1b4b' }} className="shadow-lg border-b border-white/10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <img src="/ku-logo.png" alt="KU" className="h-9 w-auto drop-shadow" />
              <div>
                <div className="font-mincho text-white font-bold text-lg tracking-[0.2em] leading-tight">LACROSSE</div>
                <div className="text-white/50 text-[10px] tracking-[0.25em] uppercase leading-tight">Scouting System</div>
              </div>
            </a>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
