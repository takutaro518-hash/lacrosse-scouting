'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, Team, Player, TeamScoutingNote, TeamScoutingVideo } from '@/lib/supabase'
import { Plus, ChevronLeft, User, FileText, Trash2, Shield, Pencil, Check, X } from 'lucide-react'

const POSITIONS = ['AT', 'MF', 'DF', 'GK']

const POSITION_COLORS: Record<string, string> = {
  AT: 'bg-red-100 text-red-700',
  MF: 'bg-green-100 text-green-700',
  DF: 'bg-blue-100 text-blue-700',
  GK: 'bg-yellow-100 text-yellow-700',
}

export default function TeamPage() {
  const { id } = useParams<{ id: string }>()
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [teamNotes, setTeamNotes] = useState<TeamScoutingNote[]>([])
  const [teamVideos, setTeamVideos] = useState<TeamScoutingVideo[]>([])
  const [loading, setLoading] = useState(true)

  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [position, setPosition] = useState('')

  const [showTeamNoteForm, setShowTeamNoteForm] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingDate, setEditingDate] = useState('')
  const [editingContent, setEditingContent] = useState('')
  const [addingVideoNoteId, setAddingVideoNoteId] = useState<string | null>(null)
  const [addVideoFile, setAddVideoFile] = useState<File | null>(null)
  const [addVideoTitle, setAddVideoTitle] = useState('')
  const [addingVideo, setAddingVideo] = useState(false)
  const addVideoFileRef = useRef<HTMLInputElement>(null)
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10))
  const [noteContent, setNoteContent] = useState('')
  const [noteScouter, setNoteScouter] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoTitle, setVideoTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    const [{ data: teamData }, { data: playerData }, { data: teamNoteData }, { data: teamVideoData }] = await Promise.all([
      supabase.from('teams').select('*').eq('id', id).single(),
      supabase.from('players').select('*').eq('team_id', id).order('position').order('number'),
      supabase.from('team_scouting_notes').select('*').eq('team_id', id).order('match_date', { ascending: false }),
      supabase.from('team_scouting_videos').select('*').order('created_at', { ascending: false }),
    ])
    setTeam(teamData)
    setPlayers(playerData ?? [])
    setTeamNotes(teamNoteData ?? [])
    setTeamVideos(teamVideoData ?? [])
    setLoading(false)
  }

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await supabase.from('players').insert({
      team_id: id,
      name: name.trim(),
      number: number.trim() || null,
      position: position || null,
    })
    setName('')
    setNumber('')
    setPosition('')
    setShowPlayerForm(false)
    fetchData()
  }

  async function addTeamNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteContent.trim()) return
    setUploading(true)

    const { data: noteData } = await supabase.from('team_scouting_notes').insert({
      team_id: id,
      match_date: noteDate,
      content: noteContent.trim(),
      scouter: noteScouter.trim() || null,
    }).select().single()

    if (videoFile && noteData) {
      const ext = videoFile.name.split('.').pop()
      const path = `team-videos/${id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('scouting-media').upload(path, videoFile)
      if (!uploadError) {
        await supabase.from('team_scouting_videos').insert({
          team_scouting_note_id: noteData.id,
          title: videoTitle.trim() || null,
          storage_path: path,
        })
      }
    }

    setNoteContent('')
    setNoteScouter('')
    setVideoFile(null)
    setVideoTitle('')
    setShowTeamNoteForm(false)
    setUploading(false)
    fetchData()
  }

  function startEditNote(note: TeamScoutingNote) {
    setEditingNoteId(note.id)
    setEditingDate(note.match_date)
    setEditingContent(note.content)
  }

  async function saveEditNote(noteId: string) {
    if (!editingContent.trim()) return
    await supabase.from('team_scouting_notes').update({
      match_date: editingDate,
      content: editingContent.trim(),
    }).eq('id', noteId)
    setEditingNoteId(null)
    fetchData()
  }

  async function addVideoToNote(noteId: string) {
    if (!addVideoFile) return
    setAddingVideo(true)
    const ext = addVideoFile.name.split('.').pop()
    const path = `team-videos/${id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('scouting-media').upload(path, addVideoFile)
    if (!error) {
      await supabase.from('team_scouting_videos').insert({
        team_scouting_note_id: noteId,
        title: addVideoTitle.trim() || null,
        storage_path: path,
      })
    }
    setAddVideoFile(null)
    setAddVideoTitle('')
    setAddingVideoNoteId(null)
    setAddingVideo(false)
    fetchData()
  }

  async function deleteTeamNote(noteId: string) {
    if (!confirm('このメモを削除しますか？')) return
    await supabase.from('team_scouting_notes').delete().eq('id', noteId)
    fetchData()
  }

  async function deleteTeamVideo(video: TeamScoutingVideo) {
    if (!confirm('この動画を削除しますか？')) return
    await supabase.storage.from('scouting-media').remove([video.storage_path])
    await supabase.from('team_scouting_videos').delete().eq('id', video.id)
    fetchData()
  }

  function getVideoUrl(path: string) {
    const { data } = supabase.storage.from('scouting-media').getPublicUrl(path)
    return data.publicUrl
  }

  const playersByPosition = POSITIONS.map(pos => ({
    pos,
    players: players.filter(p => p.position === pos),
  })).concat([{ pos: 'その他', players: players.filter(p => !p.position || !POSITIONS.includes(p.position)) }])

  if (loading) return <div className="text-center py-12 text-gray-400">読み込み中...</div>
  if (!team) return <div className="text-center py-12 text-red-400">チームが見つかりません</div>

  return (
    <div>
      <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-4 transition">
        <ChevronLeft size={16} />
        チーム一覧に戻る
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{team.name}</h1>
        {team.prefecture && <p className="text-sm text-gray-500">{team.prefecture}</p>}
      </div>

      {/* チームスカウティング */}
      <div className="bg-white rounded-xl shadow p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-blue-600" />
            <h2 className="font-bold text-gray-700 text-lg">チームスカウティング</h2>
          </div>
          <button
            onClick={() => setShowTeamNoteForm(!showTeamNoteForm)}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <Plus size={15} />
            メモを追加
          </button>
        </div>

        {showTeamNoteForm && (
          <form onSubmit={addTeamNote} className="flex flex-col gap-3 mb-5 bg-blue-50 rounded-lg p-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">対戦日</label>
              <input
                type="date"
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                value={noteDate}
                onChange={e => setNoteDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">スカウター名</label>
              <input
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white w-full"
                placeholder="例：山田太郎"
                value={noteScouter}
                onChange={e => setNoteScouter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">チーム特徴・戦術メモ *</label>
              <textarea
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full min-h-[100px] resize-y bg-white"
                placeholder="例：マンツーマンDFが基本。クリアは右サイドに偏りがち。ライドが強く速攻が得意..."
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">動画（任意）</label>
              <input
                type="file"
                accept="video/*"
                ref={fileRef}
                onChange={e => setVideoFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              {videoFile && (
                <input
                  className="border rounded-lg px-3 py-2 text-sm mt-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  placeholder="動画タイトル（任意）"
                  value={videoTitle}
                  onChange={e => setVideoTitle(e.target.value)}
                />
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                {uploading ? 'アップロード中...' : '保存'}
              </button>
              <button type="button" onClick={() => setShowTeamNoteForm(false)} className="px-4 py-2 rounded-lg text-sm border bg-white hover:bg-gray-50 transition">キャンセル</button>
            </div>
          </form>
        )}

        {teamNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">チームのスカウティングメモがまだありません</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {teamNotes.map(note => {
              const noteVideos = teamVideos.filter(v => v.team_scouting_note_id === note.id)
              const isEditing = editingNoteId === note.id
              return (
                <div key={note.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    {isEditing ? (
                      <input
                        type="date"
                        className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={editingDate}
                        onChange={e => setEditingDate(e.target.value)}
                      />
                    ) : (
                      <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                        {note.match_date}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEditNote(note.id)} className="text-green-500 hover:text-green-600 transition"><Check size={16} /></button>
                          <button onClick={() => setEditingNoteId(null)} className="text-gray-400 hover:text-gray-600 transition"><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditNote(note)} className="text-gray-300 hover:text-blue-400 transition"><Pencil size={15} /></button>
                          <button onClick={() => deleteTeamNote(note.id)} className="text-gray-300 hover:text-red-400 transition"><Trash2 size={15} /></button>
                        </>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <textarea
                      className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full min-h-[100px] resize-y"
                      value={editingContent}
                      onChange={e => setEditingContent(e.target.value)}
                    />
                  ) : (
                    <>
                      {(note as any).scouter && (
                        <p className="text-xs text-gray-400 mb-1">スカウター：{(note as any).scouter}</p>
                      )}
                      <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    </>
                  )}
                  {noteVideos.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {noteVideos.map(v => (
                        <div key={v.id} className="bg-gray-50 rounded-lg overflow-hidden">
                          {v.title && <div className="text-xs font-medium text-gray-600 px-3 pt-2">{v.title}</div>}
                          <video src={getVideoUrl(v.storage_path)} controls className="w-full max-h-64 bg-black" preload="metadata" />
                          <div className="flex justify-end px-3 pb-2">
                            <button onClick={() => deleteTeamVideo(v)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition">
                              <Trash2 size={12} />
                              削除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {addingVideoNoteId === note.id ? (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3 flex flex-col gap-2">
                      <input
                        type="file"
                        accept="video/*"
                        ref={addVideoFileRef}
                        onChange={e => setAddVideoFile(e.target.files?.[0] ?? null)}
                        className="text-sm"
                      />
                      {addVideoFile && (
                        <input
                          className="border rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="動画タイトル（任意）"
                          value={addVideoTitle}
                          onChange={e => setAddVideoTitle(e.target.value)}
                        />
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => addVideoToNote(note.id)}
                          disabled={!addVideoFile || addingVideo}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {addingVideo ? 'アップロード中...' : '追加'}
                        </button>
                        <button
                          onClick={() => { setAddingVideoNoteId(null); setAddVideoFile(null); setAddVideoTitle('') }}
                          className="px-3 py-1.5 rounded-lg text-xs border hover:bg-gray-100 transition"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingVideoNoteId(note.id)}
                      className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition"
                    >
                      <Plus size={13} />
                      動画を追加
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 選手一覧 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-700 text-lg">選手一覧</h2>
        <button
          onClick={() => setShowPlayerForm(!showPlayerForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          選手を追加
        </button>
      </div>

      {showPlayerForm && (
        <form onSubmit={addPlayer} className="bg-white rounded-xl shadow p-5 mb-6 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-700">新しい選手を追加</h2>
          <div className="flex gap-2">
            <input
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-20"
              placeholder="#番号"
              value={number}
              onChange={e => setNumber(e.target.value)}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1"
              placeholder="選手名 *"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <select
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={position}
            onChange={e => setPosition(e.target.value)}
          >
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
        <div className="text-center py-16 text-gray-400">
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
                  <span className="text-sm text-gray-400">{group.length}人</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map(player => (
                    <Link
                      key={player.id}
                      href={`/teams/${id}/players/${player.id}`}
                      className="bg-white rounded-xl shadow hover:shadow-md transition p-4 flex items-center gap-3 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {player.photo_url ? (
                          <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={22} className="text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-800 truncate">
                          {player.number && <span className="text-blue-500 mr-1">#{player.number}</span>}
                          {player.name}
                        </div>
                        {player.position && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${POSITION_COLORS[player.position] ?? 'bg-gray-100 text-gray-600'}`}>
                            {player.position}
                          </span>
                        )}
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
