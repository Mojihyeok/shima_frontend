import { useCallback, useEffect, useState, useRef } from 'react'
import { getSummary, getToday, getCustomers, grantService, getMe, updateUiMode, getWeekly } from './api'
import type { StatsSummary, CustomerSummary, MeInfo, WeekPoint } from './types'
import WeeklyChart from './WeeklyChart'
import { signalLogout } from './auth'
import { COPY, applyMode, cachedMode, speak, type Mode } from './mode'

function relativeDay(iso: string | null): string {
  if (!iso) return '-'
  const then = new Date(iso)
  const now = new Date()
  const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const d1 = new Date(then.getFullYear(), then.getMonth(), then.getDate())
  const days = Math.round((d0.getTime() - d1.getTime()) / 86400000)
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  if (days < 30) return `${Math.floor(days / 7)}주 전`
  return `${Math.floor(days / 30)}달 전`
}

function shortDate(iso: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** 증감 표시 — 색만으로 의미 전달하지 않도록 화살표 + 문장 병행 */
function Arrow({ d }: { d: number }) {
  if (d === 0) return null
  return <span aria-hidden="true">{d > 0 ? ' ↑' : ' ↓'}</span>
}

export default function Dashboard() {
  const [me, setMe] = useState<MeInfo | null>(null)
  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [today, setToday] = useState<CustomerSummary[]>([])
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [weekly, setWeekly] = useState<WeekPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRegulars, setShowRegulars] = useState(false)

  const inFlight = useRef(false)
  const failures = useRef(0)

  const load = useCallback(async () => {
    // 이전 요청이 아직 안 끝났거나, 화면이 안 보이는 탭이면 건너뜀 (서버·DB 과부하 방지)
    if (inFlight.current || document.hidden) return
    inFlight.current = true
    try {
      const [m, s, t, c, w] = await Promise.all([getMe(), getSummary(), getToday(), getCustomers(), getWeekly(8)])
      setMe(m); setSummary(s); setToday(t); setCustomers(c); setWeekly(w); setError('')
      failures.current = 0
    } catch {
      // 일시적 실패 1~2번은 기존 화면 유지, 연속 3번째부터 안내
      failures.current += 1
      if (failures.current >= 3) setError('데이터를 불러오지 못했어요. 잠시 후 자동으로 다시 시도해요.')
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    failures.current = 2 // 첫 로딩 실패는 바로 안내
    load()
    const timer = setInterval(load, 5000) // 실시간 근사 — 5초마다 갱신 (TODO: SSE)
    const onVisible = () => { if (!document.hidden) load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [load])

  const mode: Mode = me?.uiMode ?? cachedMode()
  const t = COPY[mode]

  useEffect(() => { applyMode(mode) }, [mode])

  async function toggleMode() {
    const next: Mode = mode === 'EASY' ? 'STANDARD' : 'EASY'
    setMe((m) => (m ? { ...m, uiMode: next } : m)) // 즉시 반영
    try {
      setMe(await updateUiMode(next))
    } catch {
      setMe((m) => (m ? { ...m, uiMode: mode } : m)) // 실패 시 되돌림
    }
  }

  async function onGrant(c: CustomerSummary) {
    const reward = window.prompt(`${c.name ?? '손님'}(···${c.phoneLast4})께 무엇을 드릴까요?`, '서비스 음료')
    if (!reward) return
    await grantService(c.customerId, reward)
    alert('기록했어요.')
    load()
  }

  if (loading) return <main className="wrap"><p className="muted">불러오는 중…</p></main>
  if (error) return <main className="wrap"><p className="error">{error}</p></main>

  const s = summary ?? { newThisWeek: 0, revisitThisWeek: 0, visitorsThisWeek: 0, visitorsLastWeek: 0, deltaVisitors: 0 }
  const delta = s.deltaVisitors

  const header = (
    <header className="topbar">
      <h1 className="brand">{me?.storeName} <span className="sub">사장님</span></h1>
      <div className="topbar-actions">
        <button className="chip-btn" onClick={toggleMode}>{t.modeToggle}</button>
        <button className="chip-btn quiet" onClick={signalLogout}>로그아웃</button>
      </div>
    </header>
  )

  const todayList = (
    <section className="card">
      <h2 className="card-title">{t.todayTitle} <span className="count-badge">{today.length}</span></h2>
      {today.length === 0 ? (
        <p className="muted">{t.emptyToday}</p>
      ) : (
        <ul className="list">
          {today.map((c) => (
            <li key={c.customerId} className="row">
              <div className="row-main">
                <span className="row-name">{c.name ?? '손님'}</span>
                <span className="row-sub">···{c.phoneLast4} · {t.visitNth(c.visitCount)}</span>
              </div>
              <button className="give-btn" onClick={() => onGrant(c)}>{t.grant}</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )

  // ===== 쉬움 모드: 한 화면 = 지표 1개 문장, 음성 읽어주기, 단골 목록은 접어둠 =====
  if (mode === 'EASY') {
    const spoken =
      `${t.delta(delta)}. 이번 주에 ${s.visitorsThisWeek}명 오셨고, 처음 오신 분은 ${s.newThisWeek}명이에요. ` +
      `오늘은 ${today.length}명 오셨어요.`
    return (
      <main className="wrap">
        {header}

        <section className={`card hero ${delta >= 0 ? 'up' : 'down'}`}>
          <p className="hero-line">{t.delta(delta)}<Arrow d={delta} /></p>
          <p className="hero-sub">이번 주 {s.visitorsThisWeek}명 오셨어요 · 처음 오신 분 {s.newThisWeek}명</p>
          <button className="speak-btn" onClick={() => speak(spoken)}>🔊 읽어주기</button>
        </section>

        {todayList}

        <button className="expand-btn" onClick={() => setShowRegulars((v) => !v)} aria-expanded={showRegulars}>
          {showRegulars ? '단골 손님 접기 ▲' : `단골 손님 모두 보기 (${customers.length}명) ▼`}
        </button>
        {showRegulars && (
          <section className="card">
            {customers.length === 0 ? <p className="muted">{t.emptyRegulars}</p> : (
              <ul className="list">
                {customers.map((c) => (
                  <li key={c.customerId} className="row">
                    <div className="row-main">
                      <span className="row-name">{c.name ?? '손님'}</span>
                      <span className="row-sub">···{c.phoneLast4} · 도장 {c.visitCount}개</span>
                    </div>
                    <span className="last-visit">{relativeDay(c.lastVisitAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <a className="big-link" href="#/report">이번 주 리포트 보기</a>
        <a className="big-link ghost" href="#/diagnosis">우리 가게 진단하기</a>
        <a className="big-link ghost" href="#/qr">적립 QR 화면 열기</a>
      </main>
    )
  }

  // ===== 표준 모드: 지표 4개 + 고객 표 =====
  return (
    <main className="wrap">
      {header}
      <nav className="qr-nav">
        <a className="qr-link" href="#/qr">QR 화면</a>
        <a className="qr-link ghost" href="#/qr-print">인쇄용 QR</a>
        <a className="qr-link ghost" href="#/diagnosis">온라인 진단</a>
      </nav>

      <section className="card">
        <h2 className="card-title">이번 주</h2>
        <div className="stat-grid">
          <div className="stat"><span className="num">{s.newThisWeek}</span><span className="lbl">신규</span></div>
          <div className="stat"><span className="num">{s.revisitThisWeek}</span><span className="lbl">재방문</span></div>
          <div className="stat"><span className="num">{s.visitorsThisWeek}</span><span className="lbl">이번 주 방문</span></div>
          <div className="stat"><span className="num">{s.visitorsLastWeek}</span><span className="lbl">지난주 방문</span></div>
        </div>
        <p className={`delta ${delta >= 0 ? 'up' : 'down'}`}>{t.delta(delta)}<Arrow d={delta} /></p>
      </section>

      <section className="card">
        <h2 className="card-title">방문 추이 <span className="card-sub">최근 8주</span>
          <a className="card-link" href="#/report">주간 리포트 →</a></h2>
        <WeeklyChart data={weekly} />
      </section>

      {todayList}

      <section className="card">
        <h2 className="card-title">{t.regularsTitle} <span className="count-badge">{customers.length}</span></h2>
        {customers.length === 0 ? <p className="muted">{t.emptyRegulars}</p> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>고객</th><th className="num-col">도장</th><th>첫 방문</th><th>최근 방문</th></tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.customerId}>
                    <td>{c.name ?? '손님'} <span className="row-sub">···{c.phoneLast4}</span></td>
                    <td className="num-col">{c.visitCount}</td>
                    <td>{shortDate(c.firstVisitAt)}</td>
                    <td>{relativeDay(c.lastVisitAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
