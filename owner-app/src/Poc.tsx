import { useEffect, useState, type FormEvent } from 'react'
import { getPocMetrics } from './api'
import type { PocMetrics } from './types'

const SOURCE_LABEL: Record<string, string> = {
  instagram: '인스타그램',
  blog: '네이버·블로그',
  friend: '지인 소개',
  coworker: '직장 동료 소개',
  hospital: '근처 병원 근무',
  pass: '지나가다가',
  none: '응답 안 함',
}

const pct = (v: number | null) => (v === null ? '-' : `${Math.round(v * 100)}%`)
const sec = (v: number | null) => (v === null ? '-' : `${v.toFixed(1)}초`)

/** PoC 성공 지표 한 장 — 발표·실운영 모니터링용 (표준 화면 전용) */
export default function Poc() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [m, setM] = useState<PocMetrics | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load(f?: string, t?: string) {
    setBusy(true); setError('')
    try {
      const r = await getPocMetrics(f || undefined, t || undefined)
      setM(r); setFrom(r.from); setTo(r.to)
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { load() }, [])

  function submit(e: FormEvent) {
    e.preventDefault()
    load(from, to)
  }

  const back = <a className="back-link" href="#/">← 대시보드</a>
  if (!m) return <main className="wrap">{back}<p className={error ? 'error' : 'muted'}>{error || '불러오는 중…'}</p></main>

  const goal = (ok: boolean | null, text: string) => (
    <span className={ok === null ? 'poc-goal' : ok ? 'poc-ok' : 'poc-ng'}>{text}</span>
  )
  const rate14 = m.newCustomers === 0 ? null : m.returnedWithin14Days / m.newCustomers
  const sourceTotal = Object.values(m.sources).reduce((a, b) => a + b, 0)

  const rows: [string, string, React.ReactNode][] = [
    ['적립 참여율',
      m.participationRate === null ? '손님 수 입력 필요' : `${pct(m.participationRate)} (${m.qrVisitsOnCountedDays} / ${m.enteredVisitors}명)`,
      goal(m.participationRate === null ? null : m.participationRate >= 0.3, `목표 30% · 입력한 날 ${m.daysWithCount}일`)],
    ['적립 소요 시간 (중앙값)', sec(m.medianStampSeconds),
      goal(m.medianStampSeconds === null ? null : m.medianStampSeconds <= 10, `목표 10초 이내 · 기록 ${m.timedStamps}건`)],
    ['10초 안에 끝난 비율', pct(m.within10sRate), goal(null, `느린 10%: ${sec(m.p90StampSeconds)}`)],
    ['QR 적립', `${m.qrVisits}회`, goal(null, '기간 전체')],
    ['새 손님', `${m.newCustomers}명`, goal(null, '기간 중 첫 방문')],
    ['14일 안에 다시 온 새 손님', `${m.returnedWithin14Days}명 (${pct(rate14)})`, goal(null, '첫 방문 후 14일 이내 재방문')],
    ['주간 리포트 열람', `${m.reportViews}회`, goal(null, '사장님이 리포트를 연 횟수')],
    ['진단 화면 열람', `${m.diagnosisViews}회`, goal(null, '')],
    ['재량 서비스', `${m.manualGrants}회`, goal(null, `도장 리워드 ${m.autoGrants}회`)],
  ]

  return (
    <main className="wrap">
      {back}
      <h1 className="brand">PoC 측정 지표</h1>

      <form className="poc-range" onSubmit={submit}>
        <label htmlFor="poc-from" className="sr-only">시작일</label>
        <input id="poc-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span>~</span>
        <label htmlFor="poc-to" className="sr-only">종료일</label>
        <input id="poc-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="chip-btn" type="submit" disabled={busy}>{busy ? '계산 중…' : '조회'}</button>
      </form>
      {error && <p className="error">{error}</p>}

      <section className="card">
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>지표</th><th className="num-col">값</th><th>기준</th></tr></thead>
            <tbody>
              {rows.map(([k, v, g]) => (
                <tr key={k}><th scope="row">{k}</th><td className="num-col">{v}</td><td>{g}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">어떻게 알고 왔나요? <span className="card-sub">새 손님 {sourceTotal}명</span></h2>
        <table className="data-table">
          <tbody>
            {Object.entries(m.sources).map(([k, v]) => (
              <tr key={k}>
                <th scope="row">{SOURCE_LABEL[k] ?? k}</th>
                <td className="num-col">{v}명</td>
                <td className="num-col">{sourceTotal === 0 ? '-' : `${Math.round((v / sourceTotal) * 100)}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="footnote">
        적립 참여율 = 전체 손님 수를 입력한 날의 QR 적립 ÷ 그날 전체 손님 수 (입력 안 한 날은 제외).
        적립 소요 시간 = QR 화면이 열린 뒤 적립이 끝날 때까지 (첫 방문은 동의 시간 포함).
        14일 재방문은 기간 끝 무렵 첫 방문 손님은 아직 14일이 안 지났을 수 있어요.
        상관관계일 뿐 인과가 아니에요 — "○○ 기간에 늘었다"로 표현.
      </p>
    </main>
  )
}
