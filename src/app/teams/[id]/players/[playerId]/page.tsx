'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, Player, ScoutingNote, Video } from '@/lib/supabase'
import { ChevronLeft, Plus, Video as VideoIcon, FileText, Trash2, User, Pencil, Check, X } from 'lucide-react'

const POSITION_COLORS: Record<string, string> = {
  AT: 'bg-red-100 text-red-700',
  MF: 'bg-green-100 text-green-700',
  SSDM: 'bg-purple-100 text-purple-700',
  DF: 'bg-blue-100 text-blue-700',
  G: 'bg-yellow-100 text-yellow-700',
}

export default function PlayerPage() {
  const { id: teamId, playerId } = useParams<{ id: string; playerId: string }>()
  const [player, setPlayer] = useState<Player | null>(null)
  const [notes, setNotes] = useState<ScoutingNote[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 10))
  const [content, setContent] = useState('')
  const [scouter, setScouter] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoTitle, setVideoTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [expandedVideos, setExpandedVideos] = useState<Set<string>>(new Set())
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingDate, setEditingDate] = useState('')
  const [editingContent, setEditingContent] = useState('')
  const [editingScouter, setEditingScouter] = useState('')

  useEffect(() => {
    fetchData()
  }, [playerId])

  async function fetchData() {
    const [{ data: playerData }, { data: noteData }, { data: videoData }] = await Promise.all([
      supabase.from('players').select('*').eq('id', playerId).single(),
      supabase.from('scouting_notes').select('*').eq('player_id', playerId).order('match_date', { ascending: false }),
      supabase.from('videos').select('*').eq('player_id', playerId).order('created_at', { ascending: false }),
    ])
    setPlayer(playerData)
    setNotes(noteData ?? [])
    setVideos(videoData ?? [])
    setLoading(false)
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setUploading(true)

    const { data: noteData } = await supabase.from('scouting_notes').insert({
      player_id: playerId,
      match_date: matchDate,
      content: content.trim(),
      scouter: scouter.trim() || null,
    }).select().single()

    if (videoFile && noteData) {
      const ext = videoFile.name.split('.').pop()
      const path = `videos/${playerId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('scouting-media').upload(path, videoFile)
      if (!uploadError) {
        await supabase.from('videos').insert({
          player_id: playerId,
          scouting_note_id: noteData.id,
          title: videoTitle.trim() || null,
          storage_path: path,
        })
      }
    }

    setContent('')
    setScouter('')
    setVideoFile(null)
    setVideoTitle('')
    setShowForm(false)
    setUploading(false)
    fetchData()
  }

  function startEditNote(note: ScoutingNote) {
    setEditingNoteId(note.id)
    setEditingDate(note.match_date)
    setEditingContent(note.content)
    setEditingScouter(note.scouter ?? '')
  }

  async function saveEditNote(noteId: string) {
    if (!editingContent.trim()) return
    await supabase.from('scouting_notes').update({
      match_date: editingDate,
      content: editingContent.trim(),
      scouter: editingScouter.trim() || null,
    }).eq('id', noteId)
    setEditingNoteId(null)
    fetchData()
  }

  async function deleteNote(noteId: string) {
    if (!confirm('このノートを削除しますか？')) return
    await supabase.from('scouting_notes').delete().eq('id', noteId)
    fetchData()
  }

  async function deleteVideo(video: Video) {
    if (!confirm('この動画を削除しますか？')) return
    await supabase.storage.from('scouting-media').remove([video.storage_path])
    await supabase.from('videos').delete().eq('id', video.id)
    fetchData()
  }

  function getVideoUrl(path: string) {
    const { data } = supabase.storage.from('scouting-media').getPublicUrl(path)
    return data.publicUrl
  }

  if (loading) return <div className="text-center py-12 text-gray-400">読み込み中...</div>
  if (!player) return <div className="text-center py-12 text-red-400">選手が見つかりません</div>

  const videosForNote = (noteId: string) => videos.filter(v => v.scouting_note_id === noteId)
  const unlinkedVideos = videos.filter(v => !v.scouting_note_id)

  return (
    <div>
      <Link href={`/teams/${teamId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-4 transition">
        <ChevronLeft size={16} />
        選手一覧に戻る
      </Link>

      {/* Player header */}
      <div className="bg-white rounded-xl shadow p-5 mb-6 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <User size={36} className="text-gray-400" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {player.number && <span className="text-blue-500 font-bold text-lg">#{player.number}</span>}
            <h1 className="text-2xl font-bold text-gray-800">{player.name}</h1>
            {player.position && (
              <span className={`text-sm px-2 py-0.5 rounded font-semibold ${POSITION_COLORS[player.position] ?? 'bg-gray-100 text-gray-600'}`}>
                {player.position}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            ノート {notes.length}件 · 動画 {videos.length}件
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-700 text-lg">スカウティングノート</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
        >
          <Plus size={16} />
          ノートを追加
        </button>
      </div>

      {showForm && (
        <form onSubmit={addNote} className="bg-white rounded-xl shadow p-5 mb-6 flex flex-col gap-3">
          <h3 className="font-semibold text-gray-700">新しいスカウティングノート</h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">対戦日</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={matchDate}
              onChange={e => setMatchDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">スカウター名</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              placeholder="例：山田太郎"
              value={scouter}
              onChange={e => setScouter(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">特徴・メモ *</label>
            <textarea
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full min-h-[100px] resize-y"
              placeholder="例：右利き、インサイドシュートが得意。DF時は左足に誘導すると有効..."
              value={content}
              onChange={e => setContent(e.target.value)}
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
                className="border rounded-lg px-3 py-2 text-sm mt-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border hover:bg-gray-50 transition">キャンセル</button>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p>スカウティングノートがまだありません</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {notes.map(note => {
            const noteVideos = videosForNote(note.id)
            return (
              <div key={note.id} className="bg-white rounded-xl shadow p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {editingNoteId === note.id ? (
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
                    {noteVideos.length > 0 && editingNoteId !== note.id && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <VideoIcon size={12} />
                        {noteVideos.length}本
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingNoteId === note.id ? (
                      <>
                        <button onClick={() => saveEditNote(note.id)} className="text-green-500 hover:text-green-600 transition"><Check size={16} /></button>
                        <button onClick={() => setEditingNoteId(null)} className="text-gray-400 hover:text-gray-600 transition"><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditNote(note)} className="text-gray-300 hover:text-blue-400 transition"><Pencil size={15} /></button>
                        <button onClick={() => deleteNote(note.id)} className="text-gray-300 hover:text-red-400 transition"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </div>
                {editingNoteId === note.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                      placeholder="スカウター名"
                      value={editingScouter}
                      onChange={e => setEditingScouter(e.target.value)}
                    />
                    <textarea
                      className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full min-h-[100px] resize-y"
                      value={editingContent}
                      onChange={e => setEditingContent(e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    {note.scouter && (
                      <p className="text-xs text-gray-400 mb-1">スカウター：{note.scouter}</p>
                    )}
                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  </>
                )}
                {noteVideos.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => setExpandedVideos(prev => {
                        const next = new Set(prev)
                        next.has(note.id) ? next.delete(note.id) : next.add(note.id)
                        return next
                      })}
                      className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 transition"
                    >
                      <VideoIcon size={13} />
                      動画 {noteVideos.length}本
                      <span>{expandedVideos.has(note.id) ? '▲' : '▼'}</span>
                    </button>
                    {expandedVideos.has(note.id) && (
                      <div className="mt-2 flex flex-col gap-3">
                        {noteVideos.map(v => (
                          <div key={v.id} className="bg-gray-50 rounded-lg overflow-hidden">
                            {v.title && <div className="text-xs font-medium text-gray-600 px-3 pt-2">{v.title}</div>}
                            <video src={getVideoUrl(v.storage_path)} controls className="w-full max-h-72 bg-black" preload="metadata" />
                            <div className="flex justify-end px-3 pb-2">
                              <button onClick={() => deleteVideo(v)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition">
                                <Trash2 size={12} />削除
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {unlinkedVideos.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-gray-700 text-lg mb-4">その他の動画</h2>
          <div className="flex flex-col gap-3">
            {unlinkedVideos.map(v => (
              <div key={v.id} className="bg-white rounded-xl shadow overflow-hidden">
                {v.title && <div className="text-sm font-medium text-gray-700 px-4 pt-3">{v.title}</div>}
                <video src={getVideoUrl(v.storage_path)} controls className="w-full max-h-72 bg-black" preload="metadata" />
                <div className="flex justify-end px-4 pb-3">
                  <button onClick={() => deleteVideo(v)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition">
                    <Trash2 size={12} />
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
