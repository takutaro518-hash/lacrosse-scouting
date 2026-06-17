'use client'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const GROUPS = [
  { key: 'A', label: 'A チーム', sub: 'Aチームスカウティング' },
  { key: 'B', label: 'B チーム', sub: 'Bチームスカウティング' },
  { key: 'C', label: 'C チーム', sub: 'Cチームスカウティング' },
]

export default function HomePage() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center">
      <div className="mb-10 text-center">
        <p className="text-xs tracking-[0.3em] text-gray-400 uppercase mb-2">Lacrosse Scouting</p>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">チームを選択</h1>
      </div>

      <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
        {GROUPS.map((group, i) => (
          <Link
            key={group.key}
            href={`/groups/${group.key}`}
            className="group relative bg-[#0d1b4b] text-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
            <div className="relative flex items-center justify-between px-8 py-6">
              <div>
                <div className="text-2xl font-bold tracking-widest">{group.label}</div>
                <div className="text-xs text-white/50 mt-0.5 tracking-wider">{group.sub}</div>
              </div>
              <ChevronRight size={22} className="text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all duration-200" />
            </div>
            <div className="absolute bottom-0 left-0 w-1 h-full bg-white/20 rounded-l-full" />
          </Link>
        ))}
      </div>
    </div>
  )
}
