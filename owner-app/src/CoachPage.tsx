import { useEffect, useState } from 'react'
import { coachDone, coachSkip, getCoach, getMe, getProfile, newCoach } from './api'
import type { Coach, StoreProfile } from './types'
import { applyMode, cachedMode, speak, type Mode } from './mode'
import { TASK_LABEL } from './coach'

/** 처방이 글쓰기 할 일이면 글쓰기 화면으로 바로 */
const WRITE_LINK: Record<string, string> = {
  instagram_post: '#/write?ch=instagram&topic=today',
  blog_review: '#/write?ch=blog&topic=mood',
}

/** AI 처방 화면 — 이번 주 할 일, 이유, 단계, 문구 초안(복사·선택), 안부 대상 */
export default function CoachPage() {
  const [mode, setMode] = useState<Mode>(cachedMode())
  const [c, setC] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const [profile, setProfile] = useState<StoreProfile | null>(null)

  useEffect(() => {
    getMe().then((m) => { setMode(m.uiMode); applyMode(m.uiMode) }).catch(() => {})
    getCoach().then(setC).catch(() => {}).finally(() => setLoading(false))
    getProfile().then(setProfile).catch(() => {})
  }, [])

  const easy = mode === 'EASY'

  async function act(fn: () => Promise<Coach>) {
    setBusy(true); setError('')
    try { setC(await fn()) }
    catch (e) { setError(e instanceof Error ? e.message : '처리하지 못했어요.') }
    finally { setBusy(false) }
  }

  async function copy(i: number, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(i)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      window.prompt('아래 문구를 길게 눌러 복사하세요', text)
    }
  }

  const back = <a className="back-link" href="#/">← 대시보드</a>
  if (loading) return <main className="wrap">{back}<p className="muted">불러오는 중…</p></main>

  const pending = c?.status === 'PENDING'
  const newBtn = (
    <button className="give-btn wide" disabled={busy} onClick={() => act(newCoach)}>
      {busy ? '우리 가게 기록을 살펴보는 중… (10~20초)' : c ? '새 할 일 받기' : '할 일 추천 받기'}
    </button>
  )

  return (
    <main className="wrap">
      {back}
      <h1 className="brand">{easy ? '이번 주에 할 일' : 'AI 처방'} <span className="sub">이번 주 할 일</span></h1>
      {error && <p className="error">{error}</p>}

      {profile && (profile.ownerGoal || profile.storeNotes ? (
        <section className="card profile-summary">
          <p className="card-sub">사장님 고민</p>
          <p className="profile-goal">{profile.ownerGoal ?? '(고민 미입력)'}</p>
          <a className="back-link" href="#/profile">우리 가게 이야기 고치기 →</a>
        </section>
      ) : (
        <section className="card profile-summary">
          <p className="profile-goal">고민을 알려 주시면 더 맞춤으로 추천해 드려요</p>
          <p className="muted">예: "저녁 손님이 더 왔으면", "골목이라 눈에 안 띄어요"</p>
          <a className="give-btn wide link-btn" href="#/profile">우리 가게 이야기 적기</a>
        </section>
      ))}

      {!c && <section className="card"><p className="muted">진단 결과와 손님 기록을 보고 이번 주에 할 일을 하나 골라 드려요.</p>{newBtn}</section>}

      {c && (
        <>
          <section className="card hero">
            <p className="card-sub">{TASK_LABEL[c.taskType] ?? c.taskType}{c.source === 'RULE' ? ' · 기본 추천' : ''}</p>
            <p className="hero-line">{c.title}</p>
            {c.why && <p className="hero-sub">{c.why}</p>}
            {easy && <button className="speak-btn" onClick={() => speak([c.title, c.why, ...c.steps].join('. '))}>🔊 읽어주기</button>}
            {c.status === 'DONE' && <p className="poc-ok">✓ 했어요{c.chosenDraft !== null ? ` · ${c.chosenDraft + 1}번 문구` : ''}</p>}
            {c.status === 'SKIPPED' && <p className="muted">이번엔 건너뛰었어요</p>}
          </section>

          {WRITE_LINK[c.taskType] && (
            <a className="give-btn wide link-btn" href={WRITE_LINK[c.taskType]}>
              {c.taskType === 'instagram_post' ? '인스타 글 바로 쓰기' : '가게 블로그 글 바로 쓰기'}
            </a>
          )}

          {c.steps.length > 0 && (
            <section className="card">
              <h2 className="card-title">이렇게 하면 돼요</h2>
              <ol className="coach-steps">{c.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </section>
          )}

          <section className="card">
            <h2 className="card-title">{easy ? '그대로 쓸 수 있는 문구' : '문구 초안'}</h2>
            <ul className="coach-drafts">
              {c.drafts.map((d, i) => (
                <li key={i} className={c.chosenDraft === i ? 'chosen' : undefined}>
                  <p className="coach-draft">{d}</p>
                  <div className="coach-draft-actions">
                    <button className="chip-btn quiet" onClick={() => copy(i, d)}>{copied === i ? '복사됨 ✓' : '복사'}</button>
                    {pending && (
                      <button className="chip-btn" disabled={busy} onClick={() => act(() => coachDone(c.id, i))}>이 문구로 했어요</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {c.audience.length > 0 && (
            <section className="card">
              <h2 className="card-title">요즘 안 오신 단골 <span className="count-badge">{c.audience.length}</span></h2>
              <p className="muted">전화번호는 암호화돼 있어 문자를 바로 보낼 수는 없어요. 카톡 채널·SNS에 올리고, 다음에 오시면 반갑게 알아봐 주세요.</p>
              <ul className="list">
                {c.audience.slice(0, easy ? 5 : 20).map((a) => (
                  <li key={a.customerId} className="row">
                    <div className="row-main">
                      <span className="row-name">{a.name ?? '손님'} ···{a.phoneLast4}</span>
                      <span className="row-sub">보통 {Math.max(1, Math.round(a.avgCycleDays))}일마다 · {a.daysSinceLast}일째 안 오심</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pending && (
            <section className="coach-actions">
              <button className="give-btn wide" disabled={busy} onClick={() => act(() => coachDone(c.id, null))}>했어요</button>
              <button className="chip-btn quiet wide" disabled={busy} onClick={() => act(() => coachSkip(c.id))}>이번엔 건너뛸게요</button>
              {!easy && (
                <button className="chip-btn quiet wide" disabled={busy} onClick={() => act(newCoach)}>
                  {busy ? '다시 추천받는 중…' : '다시 추천받기 (건너뛰기 기록 없이)'}
                </button>
              )}
            </section>
          )}
          {!pending && newBtn}
        </>
      )}

      <p className="footnote">
        진단 결과·방문 기록·지난 선택을 바탕으로 AI(Gemini)가 골라요. 손님 전화번호·이름은 AI에 보내지 않아요.
        AI 연결이 안 되면 진단에서 가장 약한 항목에 맞춘 기본 추천을 보여 드려요. "했어요"를 누르면 방문 그래프에 ◆로 표시돼요.
      </p>
    </main>
  )
}
