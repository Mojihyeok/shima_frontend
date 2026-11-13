import { useEffect, useState } from 'react'
import { getMe, getProfile, saveProfile } from './api'
import { applyMode, cachedMode, type Mode } from './mode'

/** 자주 나오는 고민 — 누르면 고민 칸에 붙음 */
const GOALS = ['저녁 손님 늘리기', '점심 손님 늘리기', '주말 손님 늘리기', '새 손님 늘리기', '단골이 더 자주 오게', '학생 손님 늘리기']
/** 가게 특징 예시 — 누르면 특징 칸에 붙음 (사장님 말로 고쳐 쓰기) */
const NOTE_HINTS = ['골목 안이라 지나가다 보기 어려워요', '테이크아웃 손님은 적어요', '단골이 많고 한번 오면 자주 와요',
  '근처 병원·학교 직원분들이 많이 와요', '학생 손님은 30% 정도예요', '조용하고 오래 머무는 손님이 많아요']

/**
 * 우리 가게 이야기 — 사장님 고민·가게 특징. AI 처방과 SNS 글쓰기가 이걸 먼저 보고 맞춤으로 추천.
 * 말로 해도 됨(키보드 마이크). 버튼으로 자주 쓰는 문장을 붙일 수 있음.
 */
export default function ProfilePage() {
  const [mode, setMode] = useState<Mode>(cachedMode())
  const [goal, setGoal] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    getMe().then((m) => { setMode(m.uiMode); applyMode(m.uiMode) }).catch(() => {})
    getProfile().then((p) => { setGoal(p.ownerGoal ?? ''); setNotes(p.storeNotes ?? '') }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const easy = mode === 'EASY'
  const append = (cur: string, add: string, max: number) => {
    if (cur.includes(add)) return cur
    const next = cur.trim() ? `${cur.trim()}\n${add}` : add
    return next.slice(0, max)
  }

  async function save() {
    setBusy(true); setMsg('')
    try {
      await saveProfile(goal.trim(), notes.trim())
      setMsg('저장했어요. 다음 AI 처방부터 반영돼요.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '저장하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <main className="wrap"><p className="muted">불러오는 중…</p></main>

  return (
    <main className="wrap">
      <a className="back-link" href="#/coach">← 이번 주 할 일</a>
      <h1 className="brand">우리 가게 이야기 <span className="sub">AI가 참고해요</span></h1>
      <p className="muted">{easy ? '고민과 가게 사정을 알려 주시면, 우리 가게에 딱 맞는 할 일과 글을 드려요.'
                                 : '여기 적은 고민·특징을 AI 처방과 SNS 글쓰기가 가장 먼저 반영해요. 손님 개인정보는 적지 마세요.'}</p>

      <section className="card">
        <h2 className="card-title">요즘 고민이나 목표</h2>
        <div className="hint-chips">
          {GOALS.map((g) => <button key={g} className="chip-btn quiet" onClick={() => setGoal((c) => append(c, g, 300))}>+ {g}</button>)}
        </div>
        <textarea className="write-note" rows={2} maxLength={300} value={goal} onChange={(e) => setGoal(e.target.value)}
                  placeholder="예: 저녁 시간에 손님이 더 왔으면 좋겠어요" aria-label="요즘 고민이나 목표" />
      </section>

      <section className="card">
        <h2 className="card-title">우리 가게 특징</h2>
        <p className="hint">위치, 주로 오시는 손님, 잘하는 점, 어려운 점을 편하게 적어 주세요.</p>
        <div className="hint-chips">
          {NOTE_HINTS.map((n) => <button key={n} className="chip-btn quiet" onClick={() => setNotes((c) => append(c, n, 1000))}>+ {n}</button>)}
        </div>
        <textarea className="write-note" rows={6} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="예: 대로변이 아니라 골목에 있어요. 단골이 많아요. 요즘은 학생보다 병원·학교 직원분들이 많이 오세요."
                  aria-label="우리 가게 특징" />
        <p className="hint">말로 하셔도 돼요 — 휴대폰 키보드의 🎤 버튼을 누르고 말하면 글자로 바뀌어요. ({notes.length}/1000)</p>
      </section>

      {msg && <p className="muted" role="status">{msg}</p>}
      <div className="coach-actions">
        <button className="give-btn wide" disabled={busy} onClick={save}>{busy ? '저장 중…' : '저장하기'}</button>
        <a className="chip-btn quiet wide link-btn" href="#/coach">이번 주 할 일 보러 가기</a>
      </div>
    </main>
  )
}
