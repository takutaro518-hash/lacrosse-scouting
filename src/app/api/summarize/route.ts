import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { notes, category } = await req.json()

  if (!notes || notes.length === 0) {
    return NextResponse.json({ error: 'ノートがありません' }, { status: 400 })
  }

  const notesText = notes
    .map((n: { match_date: string; scouter: string | null; content: string }) =>
      `【${n.match_date}】${n.scouter ? `（${n.scouter}）` : ''}\n${n.content}`
    )
    .join('\n\n')

  const terms = `【フィールド用語】表/裏、左上(左75)・右上(右75)・左横(左45)・右横(右45)・トップ・ハイクリ・ロークリ・X・アイランド・GLE
【対人用語】かける/抜く、外抜き/内抜き、ガン抜き/半抜き、出遅れ、ホット/スライド、ダブル、ショウ/ヘッジ、絞る、ボールダウン
【戦術名】タイガー(222)・バッファロー(141)・ペンギン(裏2)・ウルフ・イーグル・エキマン
【その他】ピック/2man・カットイン・サーキュ・pm/ディープ・フロー・ネクスト・起点・展開・フィード・オンボール/オフボール`

  const prompt = category
    ? `あなたはラクロスの戦術に詳しいコーチアシスタントです。以下のラクロス用語を正しく使ってください。

${terms}

これは「${category}」に関するスカウティングノートです。この場面（${category}）に絞って、相手DFの傾向と、こちらが取るべき攻め方をまとめてください。

## スカウティングノート（${category}）
${notesText}

---
以下の2つの見出しで、ラクロス用語を使って日本語箇条書きで簡潔にまとめてください：

## ${category}での相手DFの傾向

## こちらの攻め方・対策`
    : `あなたはラクロスの戦術に詳しいコーチアシスタントです。以下のラクロス用語を正しく使って要約してください。

${terms}

以下のスカウティングノートを3つの観点でまとめてください：

## スカウティングノート
${notesText}

---
以下の3つの見出しで、ラクロス用語を使って日本語箇条書きでまとめてください：

## 相手DFの特徴

## 取るべき対策

## オンボール・オフボールの観点`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const summary = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ summary })
  } catch (e: any) {
    const msg = e?.error?.error?.message || e?.message || 'AI要約に失敗しました'
    let friendly = msg
    if (msg.includes('credit balance')) friendly = 'AIのクレジット残高が不足しています。Anthropicのコンソールでクレジットを追加してください。'
    else if (msg.includes('rate limit')) friendly = 'AIのリクエストが混み合っています。少し待って再度お試しください。'
    return NextResponse.json({ summary: `⚠️ ${friendly}` })
  }
}
