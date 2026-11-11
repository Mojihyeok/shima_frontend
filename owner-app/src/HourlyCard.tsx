import { useEffect, useState } from 'react'
import { getHourly } from './api'
import type { HourlyStats } from './types'
import { topRounded, useWidth } from './WeeklyChart'

type Seg = 'weekday' | 'weekend'
const H = 180
const PAD = { top: 22, right: 8, bottom: 24, left: 30 }
const C_BAR = '#B5481A' // 브랜드 — 단일 계열 (WeeklyChart 재방문과 같은 검증된 색)

const hourLabel = (h: number) => (h < 12 ? `오전 ${h === 0 ? 12 : h}시` : `오후 ${h === 12 ? 12 : h - 12}시`)

function niceMax(v: number): number {
  if (v <= 2) return 2
  const step = Math.pow(10, Math.floor(Math.log10(v)))
  for (const m of [1, 2, 2.5, 5, 10]) if (m * step >= v) return m * step
  return 10 * step
}

/**
 * 시간대별 방문 — QR 적립 시각(1시간 단위), 최근 4주 하루 평균, 평일/주말 전환.
 * 쉬움: 가장 붐비는 시간 한 문장 / 표준: 막대 + 최고 시간대만 직접 라벨 + 호버 툴팁 + 표 보기.
 */
export default function HourlyCard({ easy }: { easy: boolean }) {
  const [d, setD] = useState<HourlyStats | null>(null)
  const [seg, setSeg] = useState<Seg>('weekday')

  useEffect(() => { getHourly(4).then(setD).catch(() => {}) }, [])
  if (!d) return null

  const days = (s: Seg) => Math.max(1, s === 'weekday' ? d.weekdayDays : d.weekendDays)
  const avg = (h: { weekdayTotal: number; weekendTotal: number }, s: Seg) =>
    (s === 'weekday' ? h.weekdayTotal : h.weekendTotal) / days(s)
  const total = (s: Seg) => d.hours.reduce((a, h) => a + (s === 'weekday' ? h.weekdayTotal : h.weekendTotal), 0)
  const peak = (s: Seg) => d.hours.reduce((best, h) => (avg(h, s) > avg(best, s) ? h : best), d.hours[0])

  // 쉬움 모드: 문장 하나
  if (easy) {
    const lines = (['weekday', 'weekend'] as Seg[]).filter((s) => total(s) > 0).map((s) => {
      const p = peak(s)
      return `${s === 'weekday' ? '평일' : '주말'}에는 ${hourLabel(p.hour)}에 가장 많이 오세요 (하루 평균 ${avg(p, s).toFixed(1)}명)`
    })
    return (
      <section className="card">
        <h2 className="card-title">손님이 많은 시간</h2>
        {lines.length === 0 ? <p className="muted">아직 적립 기록이 없어요.</p> : <ul className="evidence">{lines.map((l) => <li key={l}>{l}</li>)}</ul>}
      </section>
    )
  }

  // 표준 모드: 보여줄 시간 범위 = 두 구간 중 기록이 있는 시간 ±1 (없으면 9~20시)
  const used = d.hours.filter((h) => h.weekdayTotal + h.weekendTotal > 0).map((h) => h.hour)
  let lo = used.length ? Math.max(0, Math.min(...used) - 1) : 9
  let hi = used.length ? Math.min(23, Math.max(...used) + 1) : 20
  if (hi - lo < 7) { lo = Math.max(0, Math.min(lo, hi - 7)); hi = Math.min(23, lo + 7) }
  const rows = d.hours.filter((h) => h.hour >= lo && h.hour <= hi)

  const values = rows.map((h) => avg(h, seg))
  const p = peak(seg)
  const hasData = total(seg) > 0

  return (
    <section className="card">
      <h2 className="card-title">시간대별 방문 <span className="card-sub">최근 4주 · 하루 평균 · QR 적립 기준</span></h2>
      <div className="seg-toggle" role="group" aria-label="평일 주말 선택">
        {(['weekday', 'weekend'] as Seg[]).map((s) => (
          <button key={s} className={`chip-btn ${seg === s ? '' : 'quiet'}`} aria-pressed={seg === s} onClick={() => setSeg(s)}>
            {s === 'weekday' ? `평일 (${d.weekdayDays}일)` : `주말 (${d.weekendDays}일)`}
          </button>
        ))}
      </div>

      {!hasData ? <p className="muted">이 기간 {seg === 'weekday' ? '평일' : '주말'} 적립 기록이 없어요.</p> : (
        <HourBars rows={rows.map((h) => h.hour)} values={values} peakHour={p.hour} segLabel={seg === 'weekday' ? '평일' : '주말'}
                  totals={rows.map((h) => (seg === 'weekday' ? h.weekdayTotal : h.weekendTotal))} />
      )}

      <details className="chart-table">
        <summary>표로 보기</summary>
        <table className="data-table">
          <thead><tr><th>시간</th><th className="num-col">평일 하루 평균</th><th className="num-col">주말 하루 평균</th></tr></thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.hour}>
                <td>{h.hour}시</td>
                <td className="num-col">{avg(h, 'weekday').toFixed(1)}</td>
                <td className="num-col">{avg(h, 'weekend').toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="hint">적립한 손님만 세요 (전체 손님보다 적어요). 시각은 적립(계산) 시점이에요.</p>
    </section>
  )
}

/** 막대 그리기 — 데이터가 있을 때만 마운트되어 폭(ResizeObserver)을 바로 잡음 */
function HourBars({ rows, values, totals, peakHour, segLabel }: {
  rows: number[]; values: number[]; totals: number[]; peakHour: number; segLabel: string
}) {
  const { ref, w } = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)

  const max = niceMax(Math.max(0.5, ...values))
  const ticks = [0, max / 2, max]
  const innerW = Math.max(0, w - PAD.left - PAD.right)
  const innerH = H - PAD.top - PAD.bottom
  const band = rows.length ? innerW / rows.length : 0
  const barW = Math.min(20, band * 0.6)
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH
  const pi = rows.indexOf(peakHour)

  return (
    <div className="chart-plot" ref={ref} onMouseLeave={() => setActive(null)}>
      {w > 0 && (
        <svg width={w} height={H} role="img"
             aria-label={`${segLabel} 시간대별 하루 평균 방문. 가장 많은 시간 ${hourLabel(peakHour)} ${pi >= 0 ? values[pi].toFixed(1) : 0}명`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={w - PAD.right} y1={y(t)} y2={y(t)} stroke="#ECE6DF" strokeWidth={1} />
              <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="axis-text">{Number.isInteger(t) ? t : t.toFixed(1)}</text>
            </g>
          ))}
          {rows.map((hour, i) => {
            const v = values[i]
            const cx = PAD.left + band * i + band / 2
            const bh = (v / max) * innerH
            const dim = active !== null && active !== i
            return (
              <g key={hour} opacity={dim ? 0.45 : 1}>
                {v > 0 && <path d={topRounded(cx - barW / 2, y(v), barW, bh)} fill={C_BAR} />}
                {(hour % 2 === 0 || rows.length <= 10) && (
                  <text x={cx} y={H - 8} textAnchor="middle" className="axis-text">{hour}시</text>
                )}
                {i === pi && v > 0 && <text x={cx} y={y(v) - 6} textAnchor="middle" className="cap-label">{v.toFixed(1)}명</text>}
                <rect x={PAD.left + band * i} y={PAD.top} width={band} height={innerH} fill="transparent"
                      onMouseEnter={() => setActive(i)} onClick={() => setActive(active === i ? null : i)} />
              </g>
            )
          })}
        </svg>
      )}
      {active !== null && rows[active] !== undefined && (
        <div className="tooltip" style={{ left: Math.min(Math.max(PAD.left + band * active + band / 2, 70), w - 70) }}>
          <strong>{segLabel} {hourLabel(rows[active])}</strong>
          <span>하루 평균 {values[active].toFixed(1)}명</span>
          <span className="tt-total">4주 합계 {totals[active]}명</span>
        </div>
      )}
    </div>
  )
}
