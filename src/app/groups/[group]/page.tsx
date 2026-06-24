'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Plus, ChevronRight, ChevronLeft, MapPin } from 'lucide-react'

type Team = {
  id: string
  name: string
  prefecture: string | null
  group_name: string | null
  created_at: string
}

const GROUP_LABELS: Record<string, string> = {
  A: 'Aチーム',
  B: 'Bチーム',
  C: 'Cチーム',
}

export default function GroupPage() {
  const { group } = useParams<{ group: string }>()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [prefecture, setPrefecture] = useState('')

  useEffect(() => {
    fetchTeams()
  }, [group])

  async function fetchTeams() {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .eq('group_name', group)
      .order('created_at', { ascending: false })
    setTeams(data ?? [])
    setLoading(false)
  }

  async function addTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await supabase.from('teams').insert({
      name: name.trim(),
      prefecture: prefecture.trim() || null,
      group_name: group,
    })
    setName('')
    setPrefecture('')
    setShowForm(false)
    fetchTeams()
  }

  const label = GROUP_LABELS[group] ?? group

  return (
    <div>
      <Link href="/" className="flex items-center gap-1 text-xs tracking-wider text-gray-400 hover:text-gray-600 mb-6 transition uppercase">
        <ChevronLeft size={14} />
        Team Select
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-gray-400 uppercase mb-1">Scouting</p>
          <h1 className="font-mincho text-2xl font-bold tracking-wide" style={{ color: '#0d1b4b' }}>{label}　相手チーム一覧</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-xl hover:opacity-90 transition text-sm font-medium shadow"
          style={{ background: '#0d1b4b' }}
        >
          <Plus size={16} />
          チームを追加
        </button>
      </div>

      {showForm && (
        <form onSubmit={addTeam} className="bg-white rounded-2xl shadow-lg p-5 mb-6 flex flex-col gap-3 border border-gray-100">
          <h2 className="font-semibold text-gray-700">新しいチームを追加</h2>
          <input
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="チーム名 *"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="都道府県（任意）"
            value={prefecture}
            onChange={e => setPrefecture(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">追加</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border hover:bg-gray-50 transition">キャンセル</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🥍</div>
          <p>チームがまだ登録されていません</p>
          <p className="text-sm mt-1">「チームを追加」から登録してください</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.map(team => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="bg-white rounded-2xl shadow hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 p-5 flex items-center justify-between group border border-gray-100"
            >
              <div>
                <div className="font-semibold text-gray-800 text-lg">{team.name}</div>
                {team.prefecture && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin size={13} />
                    {team.prefecture}
                  </div>
                )}
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-500 transition" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
