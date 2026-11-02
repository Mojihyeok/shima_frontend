import { useEffect, useState } from 'react'
import { getAtRisk } from './api'
import type { AtRiskCustomer } from './types'

const EASY_LIMIT = 5

/**
 * 요즘 안 오신 단골 — 평소 방문 주기의 2배 이상 지난 손님 (백엔드 AtRiskService 기준).
 * 무거운 집계라 대시보드 자동 갱신과 분리해 화면 열 때 한 번만 불러옴.
 */
export default function AtRiskCard({ easy }: { easy: boolean }) {
  const [list, setList] = useState<AtRiskCustomer[] | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    getAtRisk().then(setList).catch(() => setList([]))
  }, [])

  if (list === null) return null
  const who = (c: AtRiskCustomer) => `${c.name ?? '손님'} ···${c.phoneLast4}`
  const cycle = (c: AtRiskCustomer) => Math.max(1, Math.round(c.avgCycleDays))

  return (
    <section className="card">
      <h2 className="card-title">
        {easy ? '요즘 안 오신 단골' : '이탈 위험 단골'}
        <span className="count-badge">{list.length}</span>
        {!easy && <span className="card-sub">평소 주기의 2배 이상 · 14일 이상</span>}
      </h2>

      {list.length === 0 ? (
        <p className="muted">{easy ? '오래 안 오신 단골이 없어요. 좋아요!' : '해당 손님 없음'}</p>
      ) : easy ? (
        <>
          <ul className="list">
            {(showAll ? list : list.slice(0, EASY_LIMIT)).map((c) => (
              <li key={c.customerId} className="row">
                <div className="row-main">
                  <span className="row-name">{who(c)}</span>
                  <span className="row-sub">보통 {cycle(c)}일마다 오셨는데 <b>{c.daysSinceLast}일째</b> 안 오셨어요</span>
                </div>
              </li>
            ))}
          </ul>
          {list.length > EASY_LIMIT && (
            <button className="expand-btn" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
              {showAll ? '접기 ▲' : `${list.length - EASY_LIMIT}명 더 보기 ▼`}
            </button>
          )}
        </>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>고객</th><th className="num-col">방문</th><th className="num-col">평소 주기</th><th className="num-col">안 온 지</th><th className="num-col">주기 대비</th></tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.customerId}>
                  <td>{c.name ?? '손님'} <span className="row-sub">···{c.phoneLast4}</span></td>
                  <td className="num-col">{c.visitCount}회</td>
                  <td className="num-col">{cycle(c)}일</td>
                  <td className="num-col">{c.daysSinceLast}일</td>
                  <td className="num-col">{c.overdueRatio.toFixed(1)}배</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
