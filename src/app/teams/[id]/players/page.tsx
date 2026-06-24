'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, Team, Player } from '@/lib/supabase'
import { Plus, ChevronLeft, User, Users } from 'lucide-react'

const POSITIONS = ['AT', 'MF', 'SSDM', 'DF', 'G']

const POSITION_COLORS: Record<string, string> = {
  AT: 'bg-red-100 text-red-700',
  MF: 'bg-green-100 text-green-700',
  SSDM: 'bg-purple-100 text-purple-700',
  DF: 'bg-blue-100 text-blue-700',
  G: 'bg-yellow-100 text-yellow-700',
}

export default function PlayersListPage() {
  const { id } = useParams<{ id: string }>()
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [position, setPosition] = useState('')

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    const [{ data: teamData }, { data: playerData }] = await Promise.all([
      supabase.from('teams').select('*').eq('id', id).single(),
      supabase.from('players').select('*').eq('team_id', id).order('position').order('number'),
    ])
    setTeam(teamData)
    setPlayers(playerData ?? [])
    setLoading(false)
  }

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await supabase.from('players').insert({ team_id: id, name: name.trim(), number: number.trim() || null, position: position || null })
    setName(''); setNumber(''); setPosition(''); setShowPlayerForm(false); fetchData()
  }

  const playersByPosition = POSITIONS.map(pos => ({ pos, players: players.filter(p => p.position === pos) }))
    .concat([{ pos: 'その他', players: players.filter(p => !p.position || !POSITIONS.includes(p.position)) }])

  if (loading) return <div className="text-center py-12 text-white/40">読み込み中...</div>
  if (!team) return <div className="text-center py-12 text-red-400">チームが見つかりません</div>

  return (
    <div>
      <Link href={`/teams/${id}`} className="flex items-center gap-1 text-xs tracking-wider text-white/50 hover:text-white mb-6 transition uppercase">
        <ChevronLeft size={14} />Menu
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-1">{team.name}</p>
          <h1 className="font-mincho text-2xl font-bold tracking-wide flex items-center gap-2 text-white">
            <Users size={22} />個人スカウティング
          </h1>
        </div>
        <button onClick={() => setShowPlayerForm(!showPlayerForm)}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-xl hover:opacity-90 transition text-sm font-medium shadow shrink-0 border border-white/15"
          style={{ background: '#16224d' }}>
          <Plus size={16} />選手を追加
        </button>
      </div>

      {showPlayerForm && (
        <form onSubmit={addPlayer} className="bg-white rounded-2xl shadow-lg p-5 mb-6 flex flex-col gap-3 border border-gray-100">
          <h2 className="font-semibold text-gray-700">新しい選手を追加</h2>
          <div className="flex gap-2">
            <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-20"
              placeholder="#番号" value={number} onChange={e => setNumber(e.target.value)} />
            <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1"
              placeholder="選手名 *" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={position} onChange={e => setPosition(e.target.value)}>
            <option value="">ポジション（任意）</option>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">追加</button>
            <button type="button" onClick={() => setShowPlayerForm(false)} className="px-4 py-2 rounded-lg text-sm border hover:bg-gray-50 transition">キャンセル</button>
          </div>
        </form>
      )}

      {players.length === 0 ? (
        <div className="text-center py-16 text-white/50">
          <User size={48} className="mx-auto mb-3 opacity-30" />
          <p>選手がまだ登録されていません</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {playersByPosition.map(({ pos, players: group }) => {
            if (group.length === 0) return null
            return (
              <div key={pos}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${POSITION_COLORS[pos] ?? 'bg-gray-100 text-gray-600'}`}>{pos}</span>
                  <span className="text-sm text-white/50">{group.length}人</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map(player => (
                    <Link key={player.id} href={`/teams/${id}/players/${player.id}`}
                      className="bg-white rounded-xl shadow hover:shadow-md transition p-4 flex items-center gap-3 group">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {player.photo_url ? <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                          : <User size={22} className="text-gray-400" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-800 truncate">
                          {player.number && <span className="text-blue-500 mr-1">#{player.number}</span>}
                          {player.name}
                        </div>
                        {player.position && <span className={`text-xs px-1.5 py-0.5 rounded ${POSITION_COLORS[player.position] ?? 'bg-gray-100 text-gray-600'}`}>{player.position}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
