import { useEffect, useRef, useState } from 'react'
import type { WeekPoint } from './types'
import { md } from './dates'

/**
 * 주별 방문 손님 — 누적 세로 막대 (재방문 아래 + 신규 위 = 그 주 방문 손님).
 * dataviz 규칙: 막대 ≤24px, 끝만 4px 둥글게(바닥은 직각), 조각 사이 2px 표면색 간격,
 * 범례 항상 표시(2계열) + 선택적 직접 라벨(이번 주 합계만), 호버/탭 툴팁, 표 보기 제공.
 * 색: 재방문 #B5481A, 신규 #2a78d6 — validate_palette 통과(색각이상 ΔE 27).
 */
const C_REVISIT = '#B5481A'
const C_NEW = '#2a78d6'
const GAP = 2
const R = 4
const H = 200
const PAD = { top: 22, right: 8, bottom: 26, left: 30 }

function niceMax(v: number): number {
  if (v <= 4) return 4
  const step = Math.pow(10, Math.floor(Math.log10(v)))
  for (const m of [1, 2, 2.5, 5, 10]) if (m * step >= v) return m * step
  return 10 * step
}

/** 윗면만 둥근 막대 경로 (바닥은 직각 — 기준선에 붙음) */
function topRounded(x: number, y: number, w: number, h: number): string {
  const r = Math.min(R, h, w / 2)
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return { ref, w }
}

export default function WeeklyChart({ data }: { data: WeekPoint[] }) {
  const { ref, w } = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)

  const totals = data.map((d) => d.newCount + d.revisitCount)
  const max = niceMax(Math.max(1, ...totals))
  const ticks = [0, max / 2, max].map((t) => Math.round(t))
  const innerW = Math.max(0, w - PAD.left - PAD.right)
  const innerH = H - PAD.top - PAD.bottom
  const band = data.length ? innerW / data.length : 0
  const barW = Math.min(24, band * 0.6)
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH
  const lastIdx = data.length - 1

  return (
    <div className="chart">
      <div className="legend" aria-hidden="true">
        <span><i style={{ background: C_REVISIT }} />다시 온 손님</span>
        <span><i style={{ background: C_NEW }} />새 손님</span>
      </div>

      <div className="chart-plot" ref={ref} onMouseLeave={() => setActive(null)}>
        {w > 0 && (
          <svg width={w} height={H} role="img"
               aria-label={`최근 ${data.length}주 방문 손님. 이번 주 ${totals[lastIdx] ?? 0}명`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={w - PAD.right} y1={y(t)} y2={y(t)} stroke="#ECE6DF" strokeWidth={1} />
                <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="axis-text">{t}</text>
              </g>
            ))}

            {data.map((d, i) => {
              const cx = PAD.left + band * i + band / 2
              const x = cx - barW / 2
              const base = y(0)
              const hRev = (d.revisitCount / max) * innerH
              const hNew = (d.newCount / max) * innerH
              const revTop = base - hRev
              const newBottom = d.revisitCount > 0 ? revTop - GAP : base
              const newTop = newBottom - hNew
              const dim = active !== null && active !== i
              return (
                <g key={d.weekStart} opacity={dim ? 0.45 : 1}>
                  {d.revisitCount > 0 && (
                    d.newCount > 0
                      ? <rect x={x} y={revTop} width={barW} height={hRev} fill={C_REVISIT} />
                      : <path d={topRounded(x, revTop, barW, hRev)} fill={C_REVISIT} />
                  )}
                  {d.newCount > 0 && <path d={topRounded(x, newTop, barW, hNew)} fill={C_NEW} />}
                  <text x={cx} y={H - 8} textAnchor="middle" className="axis-text">
                    {d.inProgress ? '이번주' : md(d.weekStart)}
                  </text>
                  {/* 직접 라벨은 이번 주 합계 하나만 */}
                  {i === lastIdx && totals[i] > 0 && (
                    <text x={cx} y={Math.min(newTop, revTop) - 6} textAnchor="middle" className="cap-label">{totals[i]}명</text>
                  )}
                  {/* 막대보다 넓은 히트 영역 (호버·탭) */}
                  <rect x={PAD.left + band * i} y={PAD.top} width={band} height={innerH} fill="transparent"
                        onMouseEnter={() => setActive(i)} onClick={() => setActive(active === i ? null : i)} />
                </g>
              )
            })}
          </svg>
        )}

        {active !== null && data[active] && (
          <div className="tooltip" style={{
            left: Math.min(Math.max(PAD.left + band * active + band / 2, 70), w - 70),
          }}>
            <strong>{data[active].inProgress ? '이번 주 (진행 중)' : `${md(data[active].weekStart)} 주`}</strong>
            <span><i style={{ background: C_REVISIT }} />다시 온 손님 {data[active].revisitCount}명</span>
            <span><i style={{ background: C_NEW }} />새 손님 {data[active].newCount}명</span>
            <span className="tt-total">합계 {totals[active]}명</span>
          </div>
        )}
      </div>

      <details className="chart-table">
        <summary>표로 보기</summary>
        <table className="data-table">
          <thead><tr><th>주 시작</th><th className="num-col">다시 온 손님</th><th className="num-col">새 손님</th><th className="num-col">합계</th></tr></thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.weekStart}>
                <td>{d.inProgress ? '이번 주' : md(d.weekStart)}</td>
                <td className="num-col">{d.revisitCount}</td>
                <td className="num-col">{d.newCount}</td>
                <td className="num-col">{totals[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
