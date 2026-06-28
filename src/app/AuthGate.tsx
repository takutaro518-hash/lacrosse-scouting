'use client'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Lock } from 'lucide-react'

// チーム共通アカウント（Supabaseに作成したユーザーのメール）
export const TEAM_EMAIL = 'team@keio-lacrosse.app'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: TEAM_EMAIL, password })
    if (error) setError('合言葉が違います')
    setLoading(false)
  }

  if (session === undefined) {
    return <div className="text-center py-20 text-gray-400">読み込み中...</div>
  }

  if (!session) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#0d1b4b' }}>
              <Lock size={24} className="text-white" />
            </div>
            <h1 className="font-mincho text-xl font-bold tracking-wide" style={{ color: '#0d1b4b' }}>合言葉を入力</h1>
            <p className="text-xs text-gray-400 mt-1">チームメンバー専用</p>
          </div>
          <form onSubmit={login} className="flex flex-col gap-3">
            <input
              type="password"
              autoFocus
              className="border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="合言葉"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="submit" disabled={loading || !password}
              className="text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              style={{ background: '#0d1b4b' }}>
              {loading ? '確認中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
