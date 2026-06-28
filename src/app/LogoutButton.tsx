'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(!!s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!loggedIn) return null

  return (
    <button
      onClick={() => supabase.auth.signOut()}
      className="flex items-center gap-1 text-white/60 hover:text-white text-xs transition"
    >
      <LogOut size={14} />
      ログアウト
    </button>
  )
}
