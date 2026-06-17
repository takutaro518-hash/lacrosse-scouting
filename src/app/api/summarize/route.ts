import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { notes } = await req.json()

  if (!notes || notes.length === 0) {
    return NextResponse.json({ error: 'ノートがありません' }, { status: 400 })
  }

  const notesText = notes
    .map((n: { match_date: string; scouter: string | null; content: string }) =>
      `【${n.match_date}】${n.scouter ? `（${n.scouter}）` : ''}\n${n.content}`
    )
    .join('\n\n')

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `以下はラクロスの試合スカウティングノートです。以下の観点でわかりやすく要約してください。

## 要約してほしい観点
- 相手DFの特徴
- 取るべき対策
- オンボール・オフボールの観点

## スカウティングノート
${notesText}

必ず上記3つの見出しを使って日本語で箇条書きにまとめてください。`,
      },
    ],
  })

  const summary = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ summary })
}
