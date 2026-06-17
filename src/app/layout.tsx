import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ラクロス スカウティング',
  description: '相手チームのスカウティング情報を管理するアプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-blue-700 text-white px-4 py-3 shadow">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <span className="text-2xl">🥍</span>
            <a href="/" className="font-bold text-lg tracking-wide">ラクロス スカウティング</a>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
