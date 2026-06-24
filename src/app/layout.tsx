import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KU Lacrosse Scouting',
  description: '関西大学ラクロス部 スカウティングシステム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen" style={{ background: '#f4f5f7' }}>
        <header style={{ background: '#0d1b4b' }} className="shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <img src="/ku-logo.png" alt="KU" className="h-9 w-auto drop-shadow" />
              <div>
                <div className="text-white font-bold text-base tracking-widest leading-tight">LACROSSE</div>
                <div className="text-white/50 text-[10px] tracking-[0.2em] uppercase leading-tight">Scouting System</div>
              </div>
            </a>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
