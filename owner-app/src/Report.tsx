import { useEffect, useState } from 'react'
import { getMe, getWeeklyReport, getWeekly, logEvent } from './api'
import type { WeeklyReport, WeekPoint } from './types'
import WeeklyChart from './WeeklyChart'
import { applyMode, cachedMode, speak, type Mode } from './mode'
import { addDays, md } from './dates'

/** 주간 한 장 요약 — 쉬움: 문장 + 읽어주기 / 표준: 지표 표. 방문 데이터만으로 성립(매출 입력 불필요) */
export default function Report() {
  const [mode, setMode] = useState<Mode>(cachedMode())
  const [week, setWeek] = useState<string | undefined>(undefined) // undefined = 이번 주
  const [r, setR] = useState<WeeklyReport | null>(null)
  const [error, setError] = useState('')
  const [weekly, setWeekly] = useState<WeekPoint[]>([])

  useEffect(() => {
    getMe().then((m) => { setMode(m.uiMode); applyMode(m.uiMode) }).catch(() => {})
    getWeekly(8).then(setWeekly).catch(() => {})
    logEvent('REPORT_VIEW') // PoC: 리포트 열람 횟수
  }, [])

  useEffect(() => {
    setR(null)
    getWeeklyReport(week)
      .then((x) => { setR(x); setError('') })
      .catch(() => setError('리포트를 불러오지 못했어요.'))
  }, [week])

  const nav = r && (
    <div className="week-nav">
      <button className="chip-btn quiet" onClick={() => setWeek(addDays(r.weekStart, -7))}>‹ 지난주</button>
      <span className="week-label">
        {md(r.weekStart)} ~ {md(r.weekEnd)}{r.inProgress && <em> (진행 중)</em>}
      </span>
      <button className="chip-btn quiet" disabled={r.inProgress} onClick={() => setWeek(addDays(r.weekStart, 7))}>다음 주 ›</button>
    </div>
  )

  if (error) return <main className="wrap"><a className="back-link" href="#/">← 대시보드</a><p className="error">{error}</p></main>
  if (!r) return <main className="wrap"><a className="back-link" href="#/">← 대시보드</a><p className="muted">불러오는 중…</p></main>

  const pct = r.changePct === null ? null : Math.round(r.changePct)
  const ratePct = r.revisitRate === null ? null : Math.round(r.revisitRate * 100)
  const cycle = r.avgCycleDays === null ? null : Math.round(r.avgCycleDays)
  const thisWeekWord = r.inProgress ? '이번 주' : '이 주'

  // ---- 쉬움 모드 문장 ----
  const lines = {
    head: r.visitors === 0
      ? `${thisWeekWord}에는 아직 적립한 손님이 없어요.`
      : `${thisWeekWord} 새 손님 ${r.newCount}명, 다시 온 손님 ${r.revisitCount}명이에요.`,
    change: pct === null ? '지난주 기록이 없어서 비교하기 어려워요.'
      : pct === 0 ? '지난주와 손님 수가 비슷해요.'
      : pct > 0 ? `지난주보다 손님이 ${pct}% 늘었어요.` : `지난주보다 손님이 ${-pct}% 줄었어요.`,
    rate: ratePct === null ? null : `오신 분 중 ${ratePct}%가 다시 온 단골이에요.`,
    cycle: cycle === null ? '아직 두 번 이상 오신 분이 없어요.' : `단골 손님은 보통 ${cycle}일마다 오세요.`,
    reward: r.rewardsAuto + r.rewardsManual === 0 ? '이번 주 드린 서비스는 없어요.'
      : `도장 보상 ${r.rewardsAuto}번, 사장님 서비스 ${r.rewardsManual}번 드렸어요.`,
  }

  if (mode === 'EASY') {
    const spoken = [lines.head, lines.change, lines.rate, lines.cycle, lines.reward].filter(Boolean).join(' ')
    return (
      <main className="wrap">
        <a className="back-link" href="#/">← 대시보드</a>
        <h1 className="brand">주간 리포트</h1>
        {nav}
        <section className="card hero">
          <p className="hero-line">{lines.head}</p>
          <p className="hero-sub">
            {lines.change}
            {pct !== null && pct !== 0 && <span aria-hidden="true">{pct > 0 ? ' ↑' : ' ↓'}</span>}
          </p>
          <button className="speak-btn" onClick={() => speak(spoken)}>🔊 읽어주기</button>
        </section>
        <section className="card report-lines">
          {lines.rate && <p>{lines.rate}</p>}
          <p>{lines.cycle}</p>
          <p>{lines.reward}</p>
        </section>
        <p className="footnote">QR로 적립한 손님만 세요. 지난 주 숫자는 매주 월요일에 확정돼요.</p>
      </main>
    )
  }

  // ---- 표준 모드 ----
  const rows: [string, string][] = [
    ['방문 손님', `${r.visitors}명`],
    ['신규', `${r.newCount}명`],
    ['재방문', `${r.revisitCount}명`],
    ['전주 방문 손님', `${r.prevVisitors}명`],
    ['전주 대비', pct === null ? '비교 불가 (전주 0명)' : `${pct > 0 ? '+' : ''}${pct}%`],
    ['재방문 비율', ratePct === null ? '-' : `${ratePct}%`],
    ['평균 방문 주기', cycle === null ? '-' : `${cycle}일`],
    ['자동 리워드 지급', `${r.rewardsAuto}건`],
    ['재량 서비스', `${r.rewardsManual}건`],
  ]
  return (
    <main className="wrap">
      <a className="back-link" href="#/">← 대시보드</a>
      <h1 className="brand">주간 리포트</h1>
      {nav}
      <section className="card">
        <p className="report-head">{lines.head}</p>
        <table className="data-table report-table">
          <tbody>
            {rows.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td className="num-col">{v}</td></tr>)}
          </tbody>
        </table>
      </section>
      <section className="card">
        <h2 className="card-title">방문 추이 <span className="card-sub">최근 8주</span></h2>
        <WeeklyChart data={weekly} />
      </section>
      <p className="footnote">
        정의 — 신규: 이 주에 첫 방문 / 재방문 비율: 재방문 ÷ 방문 손님 / 평균 방문 주기: 2회 이상 방문 손님의 평균 간격.
        QR 적립 기준이며 끝난 주는 매주 월요일 00:05에 스냅샷으로 확정.
      </p>
    </main>
  )
}
