'use client'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const GROUPS = [
  { key: 'A', label: 'A TEAM', sub: 'Aチームスカウティング' },
  { key: 'B', label: 'B TEAM', sub: 'Bチームスカウティング' },
  { key: 'C', label: 'C TEAM', sub: 'Cチームスカウティング' },
]

export default function HomePage() {
  return (
    <div className="min-h-[78vh] flex flex-col justify-center">
      <div className="mb-10 text-center">
        <p className="text-xs tracking-[0.4em] text-white/40 uppercase mb-2">Select Your Team</p>
        <h1 className="font-mincho text-3xl font-bold tracking-wide text-white">チームを選択</h1>
      </div>

      <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
        {GROUPS.map(group => (
          <Link
            key={group.key}
            href={`/groups/${group.key}`}
            className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 border border-white/10"
            style={{ background: '#16224d' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent" />
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 rounded-l-full" />
            <div className="relative flex items-center justify-between px-7 py-5">
              <div>
                <div className="font-mincho text-xl font-bold tracking-[0.2em] text-white">{group.label}</div>
                <div className="text-[11px] text-white/40 tracking-widest mt-0.5">{group.sub}</div>
              </div>
              <ChevronRight size={20} className="text-white/30 group-hover:text-white/70 group-hover:translate-x-1 transition-all duration-200" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
