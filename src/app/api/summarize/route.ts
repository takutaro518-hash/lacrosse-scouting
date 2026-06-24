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
        content: `あなたはラクロスの戦術に詳しいコーチアシスタントです。以下のラクロス用語を正しく使って要約してください。

【フィールド用語】表/裏、左上(左75)・右上(右75)・左横(左45)・右横(右45)・トップ・ハイクリ・ロークリ・X・アイランド・GLE
【対人用語】かける/抜く、外抜き/内抜き、ガン抜き/半抜き、出遅れ、ホット/スライド、ダブル、ショウ/ヘッジ、絞る、ボールダウン
【戦術名】タイガー(222)・バッファロー(141)・ペンギン(裏2)・ウルフ・イーグル・エキマン
【その他】ピック/2man・カットイン・サーキュ・pm/ディープ・フロー・ネクスト・起点・展開・フィード・オンボール/オフボール

以下のスカウティングノートを3つの観点でまとめてください：

## スカウティングノート
${notesText}

---
以下の3つの見出しで、ラクロス用語を使って日本語箇条書きでまとめてください：

## 相手DFの特徴

## 取るべき対策

## オンボール・オフボールの観点`,
      },
    ],
  })

  const summary = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ summary })
}
