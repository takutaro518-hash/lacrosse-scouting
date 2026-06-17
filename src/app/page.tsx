'use client'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const GROUPS = [
  { key: 'A', label: 'Aチーム', color: 'bg-red-600 hover:bg-red-700' },
  { key: 'B', label: 'Bチーム', color: 'bg-blue-600 hover:bg-blue-700' },
  { key: 'C', label: 'Cチーム', color: 'bg-green-600 hover:bg-green-700' },
]

export default function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">チームを選択</h1>
      <p className="text-sm text-gray-500 mb-8">スカウティングするチームを選んでください</p>

      <div className="flex flex-col gap-4">
        {GROUPS.map(group => (
          <Link
            key={group.key}
            href={`/groups/${group.key}`}
            className={`${group.color} text-white rounded-2xl shadow-md transition p-6 flex items-center justify-between`}
          >
            <span className="text-2xl font-bold tracking-wide">{group.label}</span>
            <ChevronRight size={28} />
          </Link>
        ))}
      </div>
    </div>
  )
}
