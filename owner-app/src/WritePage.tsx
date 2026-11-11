import { useEffect, useState } from 'react'
import { addAction, getMe, writePost } from './api'
import type { WriteResult } from './types'
import { applyMode, cachedMode, type Mode } from './mode'
import { TOPICS, hashParams } from './write'

type Channel = 'instagram' | 'blog'

/**
 * SNS 글 대신 쓰기 — 글쓰기가 귀찮은 사장님용: 어디에 → 무엇을 → (한 줄 메모) → 완성 글 복사 → 올렸어요.
 * 메모는 키보드 마이크로 말해도 됨. 사실은 사장님 메모·매장 정보에서만 (지어내지 않음).
 */
export default function WritePage() {
  const p = hashParams()
  const [mode, setMode] = useState<Mode>(cachedMode())
  const [ch, setCh] = useState<Channel | null>(p.get('ch') === 'blog' ? 'blog' : p.get('ch') === 'instagram' ? 'instagram' : null)
  const [topic, setTopic] = useState<string | null>(TOPICS.some((t) => t.value === p.get('topic')) ? p.get('topic') : null)
  const [note, setNote] = useState('')
  const [r, setR] = useState<WriteResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [posted, setPosted] = useState(false)

  useEffect(() => {
    getMe().then((m) => { setMode(m.uiMode); applyMode(m.uiMode) }).catch(() => {})
  }, [])

  const easy = mode === 'EASY'
  const t = TOPICS.find((x) => x.value === topic)
  const canWrite = !!ch && !!topic && (topic !== 'free' || note.trim().length > 0) && !busy

  async function write() {
    if (!ch || !topic) return
    setBusy(true); setError(''); setCopied(false); setPosted(false)
    try { setR(await writePost(ch, topic, note.trim())) }
    catch (e) { setError(e instanceof Error ? e.message : '글을 쓰지 못했어요.') }
    finally { setBusy(false) }
  }

  const fullText = r
    ? [r.title, r.body, r.hashtags.map((h) => `#${h}`).join(' ')].filter(Boolean).join('\n\n')
    : ''

  async function copy() {
    try { await navigator.clipboard.writeText(fullText); setCopied(true) }
    catch { window.prompt('아래 글을 길게 눌러 복사하세요', fullText) }
  }

  async function markPosted() {
    if (!r) return
    try {
      await addAction(r.channel === 'instagram' ? 'instagram_post' : 'blog_review', undefined, `${t?.label ?? ''} 글 (쉬마 작성)`)
      setPosted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '기록하지 못했어요.')
    }
  }

  return (
    <main className="wrap">
      <a className="back-link" href="#/">← 대시보드</a>
      <h1 className="brand">{easy ? '글 대신 써 드려요' : 'SNS 글 쓰기'} <span className="sub">인스타 · 블로그</span></h1>

      <section className="card">
        <h2 className="card-title">1. 어디에 올리세요?</h2>
        <div className="write-choice">
          {(['instagram', 'blog'] as Channel[]).map((c) => (
            <button key={c} className={`action-btn ${ch === c ? 'picked' : ''}`} aria-pressed={ch === c} onClick={() => { setCh(c); setR(null) }}>
              {c === 'instagram' ? '인스타그램' : '블로그'}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">2. 무엇에 대해 쓸까요?</h2>
        <div className="action-grid">
          {TOPICS.map((x) => (
            <button key={x.value} className={`action-btn ${topic === x.value ? 'picked' : ''}`} aria-pressed={topic === x.value}
                    onClick={() => { setTopic(x.value); setR(null) }}>{x.label}</button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">3. 한 줄만 알려 주세요 <span className="card-sub">{topic === 'free' ? '필수' : '선택'}</span></h2>
        <textarea className="write-note" rows={3} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder={t?.placeholder ?? '예: 오늘 딸기 케이크 새로 구웠어요'} aria-label="한 줄 메모" />
        <p className="hint">말로 하셔도 돼요 — 휴대폰 키보드의 🎤 버튼을 누르고 말하면 글자로 바뀌어요. 메뉴·가격은 적어 주신 것만 써요.</p>
        {error && <p className="error">{error}</p>}
        <button className="give-btn wide" disabled={!canWrite} onClick={write}>
          {busy ? '글 쓰는 중… (10초 정도)' : r ? '다른 버전으로 다시 쓰기' : '글 써 줘요'}
        </button>
      </section>

      {r && (
        <section className="card write-result">
          <h2 className="card-title">완성된 글 {r.source === 'RULE' && <span className="card-sub">기본 문구</span>}</h2>
          {r.title && <p className="write-title">{r.title}</p>}
          <p className="write-body">{r.body}</p>
          {r.hashtags.length > 0 && <p className="write-tags">{r.hashtags.map((h) => `#${h}`).join(' ')}</p>}
          <div className="coach-actions">
            <button className="give-btn wide" onClick={copy}>{copied ? '복사됐어요 ✓ 앱에 붙여넣기 하세요' : '전체 복사'}</button>
            {posted
              ? <p className="poc-ok">✓ 올린 것으로 기록했어요 (방문 그래프에 ◆)</p>
              : <button className="chip-btn quiet wide" onClick={markPosted}>올렸어요 (기록하기)</button>}
          </div>
          {r.channel === 'instagram' && <p className="hint">사진은 직접 골라 주세요. 가게 위치 태그를 달면 더 잘 보여요.</p>}
        </section>
      )}
    </main>
  )
}
