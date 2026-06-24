'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, Team, TeamScoutingNote, TeamScoutingVideo } from '@/lib/supabase'
import { Plus, ChevronLeft, Trash2, Shield, Pencil, Check, X, Video as VideoIcon, ChevronDown, ChevronUp } from 'lucide-react'

const SCOUTING_CATEGORIES = [
  { key: 'ローウィングがけ', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { key: 'ハイウィングがけ', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { key: '裏がけ', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { key: 'トップがけ', color: 'bg-green-50 border-green-200 text-green-700' },
  { key: '表2on2', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { key: '裏2on2', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { key: 'その他', color: 'bg-gray-50 border-gray-200 text-gray-600' },
]

export default function OrganizationPage() {
  const { id } = useParams<{ id: string }>()
  const [team, setTeam] = useState<Team | null>(null)
  const [teamNotes, setTeamNotes] = useState<TeamScoutingNote[]>([])
  const [teamVideos, setTeamVideos] = useState<TeamScoutingVideo[]>([])
  const [loading, setLoading] = useState(true)

  const [addingCategory, setAddingCategory] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingDate, setEditingDate] = useState('')
  const [editingContent, setEditingContent] = useState('')
  const [editingScouter, setEditingScouter] = useState('')
  const [expandedVideos, setExpandedVideos] = useState<Set<string>>(new Set())
  const [addingVideoNoteId, setAddingVideoNoteId] = useState<string | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  const [summary, setSummary] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

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

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    const [{ data: teamData }, { data: teamNoteData }, { data: teamVideoData }] = await Promise.all([
      supabase.from('teams').select('*').eq('id', id).single(),
      supabase.from('team_scouting_notes').select('*').eq('team_id', id).order('match_date', { ascending: false }),
      supabase.from('team_scouting_videos').select('*').order('created_at', { ascending: false }),
    ])
    setTeam(teamData)
    setTeamNotes(teamNoteData ?? [])
    setTeamVideos(teamVideoData ?? [])
    setLoading(false)
  }

  async function addTeamNote(e: React.FormEvent, category: string) {
    e.preventDefault()
    if (!noteContent.trim()) return
    setUploading(true)

    const { data: noteData, error: noteError } = await supabase.from('team_scouting_notes').insert({
      team_id: id,
      match_date: noteDate,
      content: noteContent.trim(),
      scouter: noteScouter.trim() || null,
      category,
    }).select().single()

    if (noteError) { alert('保存エラー: ' + noteError.message); setUploading(false); return }

    if (videoFile && noteData) {
      const ext = videoFile.name.split('.').pop()
      const path = `team-videos/${id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('scouting-media').upload(path, videoFile)
      if (uploadError) {
        alert('動画アップロードエラー: ' + uploadError.message)
      } else {
        await supabase.from('team_scouting_videos').insert({ team_scouting_note_id: noteData.id, title: videoTitle.trim() || null, storage_path: path })
      }
    }

    setNoteContent(''); setNoteScouter(''); setVideoFile(null); setVideoTitle('')
    setAddingCategory(null); setUploading(false); fetchData()
  }

  function startEditNote(note: TeamScoutingNote) {
    setEditingNoteId(note.id); setEditingDate(note.match_date)
    setEditingContent(note.content); setEditingScouter((note as any).scouter ?? '')
  }

  async function saveEditNote(noteId: string) {
    if (!editingContent.trim()) return
    await supabase.from('team_scouting_notes').update({ match_date: editingDate, content: editingContent.trim(), scouter: editingScouter.trim() || null }).eq('id', noteId)
    setEditingNoteId(null); fetchData()
  }

  async function addVideoToNote(noteId: string) {
    if (!addVideoFile) return
    setAddingVideo(true)
    const ext = addVideoFile.name.split('.').pop()
    const path = `team-videos/${id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('scouting-media').upload(path, addVideoFile)
    if (error) { alert('動画アップロードエラー: ' + error.message) }
    else { await supabase.from('team_scouting_videos').insert({ team_scouting_note_id: noteId, title: addVideoTitle.trim() || null, storage_path: path }) }
    setAddVideoFile(null); setAddVideoTitle(''); setAddingVideoNoteId(null); setAddingVideo(false); fetchData()
  }

  async function deleteTeamNote(noteId: string) {
    if (!confirm('このメモを削除しますか？')) return
    await supabase.from('team_scouting_notes').delete().eq('id', noteId); fetchData()
  }

  async function deleteTeamVideo(video: TeamScoutingVideo) {
    if (!confirm('この動画を削除しますか？')) return
    await supabase.storage.from('scouting-media').remove([video.storage_path])
    await supabase.from('team_scouting_videos').delete().eq('id', video.id); fetchData()
  }

  async function generateSummary() {
    if (teamNotes.length === 0) return
    setSummarizing(true); setShowSummary(true); setSummary('')
    const res = await fetch('/api/summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: teamNotes }) })
    const data = await res.json()
    setSummary(data.summary ?? 'エラーが発生しました'); setSummarizing(false)
  }

  function getVideoUrl(path: string) {
    return supabase.storage.from('scouting-media').getPublicUrl(path).data.publicUrl
  }

  function toggleCategory(key: string) {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  if (loading) return <div className="text-center py-12 text-gray-400">読み込み中...</div>
  if (!team) return <div className="text-center py-12 text-red-400">チームが見つかりません</div>

  return (
    <div>
      <Link href={`/teams/${id}`} className="flex items-center gap-1 text-xs tracking-wider text-gray-400 hover:text-gray-600 mb-6 transition uppercase">
        <ChevronLeft size={14} />Menu
      </Link>

      <div className="mb-6">
        <p className="text-[10px] tracking-[0.3em] text-gray-400 uppercase mb-1">{team.name}</p>
        <h1 className="font-mincho text-2xl font-bold tracking-wide flex items-center gap-2" style={{ color: '#0d1b4b' }}>
          <Shield size={22} />組織スカウティング
        </h1>
      </div>

      {teamNotes.length > 0 && (
        <div className="flex justify-end mb-4">
          <button onClick={generateSummary} disabled={summarizing}
            className="flex items-center gap-1 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition text-sm shadow disabled:opacity-50">
            ✨ AI要約
          </button>
        </div>
      )}

      {showSummary && (
        <div className="mb-5 bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-purple-700">✨ AI要約</span>
            <button onClick={() => setShowSummary(false)} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
          </div>
          {summarizing ? <p className="text-sm text-purple-400 animate-pulse">AIが分析中...</p>
            : <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{summary}</p>}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {SCOUTING_CATEGORIES.map(({ key, color }) => {
          const catNotes = teamNotes.filter(n => (n as any).category === key || (!((n as any).category) && key === 'その他'))
          const isCollapsed = collapsedCategories.has(key)
          const isAdding = addingCategory === key

          return (
            <div key={key} className={`border rounded-xl overflow-hidden ${color.split(' ').filter(c => c.startsWith('border')).join(' ')}`}>
              <div className={`flex items-center justify-between px-4 py-3 ${color.split(' ').filter(c => c.startsWith('bg')).join(' ')}`}>
                <button onClick={() => toggleCategory(key)} className="flex items-center gap-2 flex-1 text-left">
                  <span className={`text-sm font-bold ${color.split(' ').filter(c => c.startsWith('text')).join(' ')}`}>{key}</span>
                  <span className="text-xs text-gray-400">{catNotes.length}件</span>
                  {isCollapsed ? <ChevronDown size={14} className="text-gray-400 ml-auto" /> : <ChevronUp size={14} className="text-gray-400 ml-auto" />}
                </button>
                <button onClick={() => { setAddingCategory(isAdding ? null : key); setNoteContent(''); setNoteScouter(''); setVideoFile(null); setVideoTitle('') }}
                  className="ml-3 flex items-center gap-1 bg-white/80 hover:bg-white text-gray-600 px-2 py-1 rounded-lg text-xs transition shadow-sm">
                  <Plus size={12} />追加
                </button>
              </div>

              {!isCollapsed && (
                <div className="px-4 py-3 flex flex-col gap-3">
                  {isAdding && (
                    <form onSubmit={e => addTeamNote(e, key)} className="flex flex-col gap-3 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex gap-2">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">対戦日</label>
                          <input type="date" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                            value={noteDate} onChange={e => setNoteDate(e.target.value)} required />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-400 mb-1 block">スカウター名</label>
                          <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white w-full"
                            placeholder="例：山田太郎" value={noteScouter} onChange={e => setNoteScouter(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">スカウティングメモ *</label>
                        <textarea className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full min-h-[80px] resize-y bg-white"
                          placeholder={`${key}に関する特徴・対策を入力...`} value={noteContent} onChange={e => setNoteContent(e.target.value)} required />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">動画（任意・50MB以下）</label>
                        <input type="file" accept="video/*" ref={fileRef} onChange={e => setVideoFile(e.target.files?.[0] ?? null)} className="text-sm" />
                        {videoFile && <input className="border rounded-lg px-3 py-2 text-sm mt-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                          placeholder="動画タイトル（任意）" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} />}
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={uploading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
                          {uploading ? 'アップロード中...' : '保存'}
                        </button>
                        <button type="button" onClick={() => setAddingCategory(null)}
                          className="px-4 py-2 rounded-lg text-sm border bg-white hover:bg-gray-50 transition">キャンセル</button>
                      </div>
                    </form>
                  )}

                  {catNotes.length === 0 && !isAdding ? (
                    <p className="text-xs text-gray-400 py-2 text-center">まだメモがありません</p>
                  ) : (
                    catNotes.map(note => {
                      const noteVideos = teamVideos.filter(v => v.team_scouting_note_id === note.id)
                      const isEditing = editingNoteId === note.id
                      return (
                        <div key={note.id} className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            {isEditing ? (
                              <input type="date" className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={editingDate} onChange={e => setEditingDate(e.target.value)} />
                            ) : (
                              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded">{note.match_date}</span>
                            )}
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <button onClick={() => saveEditNote(note.id)} className="text-green-500 hover:text-green-600"><Check size={16} /></button>
                                  <button onClick={() => setEditingNoteId(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEditNote(note)} className="text-gray-300 hover:text-blue-400"><Pencil size={15} /></button>
                                  <button onClick={() => deleteTeamNote(note.id)} className="text-gray-300 hover:text-red-400"><Trash2 size={15} /></button>
                                </>
                              )}
                            </div>
                          </div>
                          {isEditing ? (
                            <div className="flex flex-col gap-2">
                              <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                                placeholder="スカウター名" value={editingScouter} onChange={e => setEditingScouter(e.target.value)} />
                              <textarea className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full min-h-[80px] resize-y"
                                value={editingContent} onChange={e => setEditingContent(e.target.value)} />
                            </div>
                          ) : (
                            <>
                              {(note as any).scouter && <p className="text-xs text-gray-400 mb-1">スカウター：{(note as any).scouter}</p>}
                              <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
                            </>
                          )}
                          {noteVideos.length > 0 && (
                            <div className="mt-2">
                              <button onClick={() => setExpandedVideos(prev => { const n = new Set(prev); n.has(note.id) ? n.delete(note.id) : n.add(note.id); return n })}
                                className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 transition">
                                <VideoIcon size={13} />動画 {noteVideos.length}本 <span>{expandedVideos.has(note.id) ? '▲' : '▼'}</span>
                              </button>
                              {expandedVideos.has(note.id) && (
                                <div className="mt-2 flex flex-col gap-2">
                                  {noteVideos.map(v => (
                                    <div key={v.id} className="bg-gray-50 rounded-lg overflow-hidden">
                                      {v.title && <div className="text-xs font-medium text-gray-600 px-3 pt-2">{v.title}</div>}
                                      <video src={getVideoUrl(v.storage_path)} controls className="w-full max-h-64 bg-black" preload="metadata" />
                                      <div className="flex justify-end px-3 pb-2">
                                        <button onClick={() => deleteTeamVideo(v)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition"><Trash2 size={12} />削除</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {addingVideoNoteId === note.id ? (
                            <div className="mt-2 bg-gray-50 rounded-lg p-3 flex flex-col gap-2">
                              <input type="file" accept="video/*" ref={addVideoFileRef} onChange={e => setAddVideoFile(e.target.files?.[0] ?? null)} className="text-sm" />
                              {addVideoFile && <input className="border rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="動画タイトル（任意）" value={addVideoTitle} onChange={e => setAddVideoTitle(e.target.value)} />}
                              <div className="flex gap-2">
                                <button onClick={() => addVideoToNote(note.id)} disabled={!addVideoFile || addingVideo}
                                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 transition disabled:opacity-50">
                                  {addingVideo ? 'アップロード中...' : '追加'}
                                </button>
                                <button onClick={() => { setAddingVideoNoteId(null); setAddVideoFile(null); setAddVideoTitle('') }}
                                  className="px-3 py-1.5 rounded-lg text-xs border hover:bg-gray-100 transition">キャンセル</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setAddingVideoNoteId(note.id)}
                              className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition">
                              <Plus size={13} />動画を追加
                            </button>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
