import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Team = {
  id: string
  name: string
  prefecture: string | null
  notes: string | null
  created_at: string
}

export type Player = {
  id: string
  team_id: string
  name: string
  number: string | null
  position: string | null
  photo_url: string | null
  created_at: string
}

export type ScoutingNote = {
  id: string
  player_id: string
  match_date: string
  content: string
  created_at: string
  videos?: Video[]
}

export type Video = {
  id: string
  player_id: string
  scouting_note_id: string | null
  title: string | null
  storage_path: string
  created_at: string
}

export type TeamScoutingNote = {
  id: string
  team_id: string
  match_date: string
  content: string
  created_at: string
}

export type TeamScoutingVideo = {
  id: string
  team_scouting_note_id: string
  title: string | null
  storage_path: string
  created_at: string
}
