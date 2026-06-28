'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, Team } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Users, Shield } from 'lucide-react'

export default function OfMenuPage() {
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

  return (
    <div>
      <Link href={`/teams/${id}`} className="flex items-center gap-1 text-xs tracking-wider text-gray-400 hover:text-gray-600 mb-6 transition uppercase">
        <ChevronLeft size={14} />OF / DF
      </Link>

      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] text-gray-400 uppercase mb-1">{team.name} ・ OFスカウティング</p>
        <h1 className="font-mincho text-2xl font-bold tracking-wide" style={{ color: '#0d1b4b' }}>相手DFをスカウティング</h1>
      </div>

      <div className="flex flex-col gap-4 max-w-2xl">
        <Link href={`/teams/${id}/players`}
          className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 bg-white border border-gray-100">
          <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: '#0d1b4b' }} />
          <div className="flex items-center gap-5 px-7 py-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#0d1b4b' }}>
              <Users size={26} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-mincho text-lg font-bold tracking-wide" style={{ color: '#0d1b4b' }}>個人スカウティング</div>
              <div className="text-xs text-gray-400 mt-0.5">相手DF選手の対人・特徴</div>
            </div>
            <ChevronRight size={22} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link href={`/teams/${id}/organization`}
          className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 bg-white border border-gray-100">
          <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: '#0d1b4b' }} />
          <div className="flex items-center gap-5 px-7 py-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#0d1b4b' }}>
              <Shield size={26} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-mincho text-lg font-bold tracking-wide" style={{ color: '#0d1b4b' }}>組織スカウティング</div>
              <div className="text-xs text-gray-400 mt-0.5">かけどころ別の相手DF組織</div>
            </div>
            <ChevronRight size={22} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>
    </div>
  )
}
