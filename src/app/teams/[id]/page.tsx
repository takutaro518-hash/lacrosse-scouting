'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, Team } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Swords, ShieldHalf } from 'lucide-react'

export default function TeamOfDfBranchPage() {
  const { id } = useParams<{ id: string }>()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('teams').select('*').eq('id', id).single().then(({ data }) => {
      setTeam(data); setLoading(false)
    })
  }, [id])

  if (loading) return <div className="text-center py-12 text-gray-400">読み込み中...</div>
  if (!team) return <div className="text-center py-12 text-red-400">チームが見つかりません</div>

  const backHref = (team as any).group_name ? `/groups/${(team as any).group_name}` : '/'

  return (
    <div>
      <Link href={backHref} className="flex items-center gap-1 text-xs tracking-wider text-gray-400 hover:text-gray-600 mb-6 transition uppercase">
        <ChevronLeft size={14} />Team List
      </Link>

      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] text-gray-400 uppercase mb-1">{team.name}</p>
        <h1 className="font-mincho text-2xl font-bold tracking-wide" style={{ color: '#0d1b4b' }}>あなたは OF / DF ?</h1>
        <p className="text-sm text-gray-500 mt-1">スカウティングする立場を選んでください</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
        <Link href={`/teams/${id}/of`}
          className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 bg-white border border-gray-100">
          <div className="absolute left-0 top-0 right-0 h-1.5 bg-red-500" />
          <div className="flex flex-col items-center text-center gap-3 px-7 py-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-500">
              <Swords size={30} className="text-white" />
            </div>
            <div>
              <div className="font-mincho text-xl font-bold tracking-widest text-red-600">OF</div>
              <div className="text-xs text-gray-400 mt-1">相手DFをスカウティング</div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500 transition" />
          </div>
        </Link>

        <Link href={`/teams/${id}/df`}
          className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 bg-white border border-gray-100">
          <div className="absolute left-0 top-0 right-0 h-1.5 bg-blue-600" />
          <div className="flex flex-col items-center text-center gap-3 px-7 py-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-600">
              <ShieldHalf size={30} className="text-white" />
            </div>
            <div>
              <div className="font-mincho text-xl font-bold tracking-widest text-blue-700">DF</div>
              <div className="text-xs text-gray-400 mt-1">相手OFをスカウティング</div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500 transition" />
          </div>
        </Link>
      </div>
    </div>
  )
}
