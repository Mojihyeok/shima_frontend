import type { DiagnosisPeer } from './types'

const median = (v: number[]) => {
  if (v.length === 0) return 0
  const s = [...v].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** 쉬움 모드 문장: "주변 4곳보다 블로그 글이 2.1배 많아요" */
function compare(mine: number, med: number, what: string): string {
  if (med <= 0) return mine > 0 ? `${what}이 주변 가게보다 많아요` : `${what}이 주변 가게처럼 아직 없어요`
  const r = mine / med
  if (r >= 1.15) return `${what}이 주변 가게보다 ${r.toFixed(1)}배 많아요`
  if (r <= 0.85) return `${what}이 주변 가게의 ${Math.round(r * 100)}% 정도예요`
  return `${what}이 주변 가게와 비슷해요`
}

/** 주변 가게와 비교 — 같은 "동네 + 업종" 검색 상위 가게 (블로그 언급·최근 활동) */
export default function PeerCard({ peers, keyword, easy }: { peers: DiagnosisPeer[]; keyword: string | null; easy: boolean }) {
  const others = peers.filter((p) => !p.self)
  const self = peers.find((p) => p.self)
  if (!self || others.length === 0) return null

  const medMention = median(others.map((p) => p.blogMentions))
  const medRecent = median(others.map((p) => p.recentPosts30))
  const rows = [...peers].sort((a, b) => b.blogMentions - a.blogMentions)

  return (
    <section className="card">
      <h2 className="card-title">
        주변 가게와 비교 <span className="card-sub">{keyword ? `'${keyword}' 검색 상위 ${others.length}곳` : `${others.length}곳`}</span>
      </h2>
      {easy ? (
        <ul className="evidence">
          <li>{compare(self.blogMentions, medMention, '블로그 글')}</li>
          <li>{compare(self.recentPosts30, medRecent, '최근 한 달 새 글')}</li>
        </ul>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>가게</th><th className="num-col">블로그 언급(추정)</th><th className="num-col">최근 30일 새 글</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.name} className={p.self ? 'peer-self' : undefined}>
                  <td>{p.name}{p.self ? ' (우리 가게)' : ''}</td>
                  <td className="num-col">{p.blogMentions.toLocaleString()}</td>
                  <td className="num-col">{p.recentPosts30}</td>
                </tr>
              ))}
              <tr className="peer-median">
                <td>주변 가게 중앙값</td>
                <td className="num-col">{Math.round(medMention).toLocaleString()}</td>
                <td className="num-col">{Math.round(medRecent)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="hint">블로그 언급은 "가게 이름 + 동네" 검색 결과로 추정한 값이에요. 리뷰 수는 네이버가 공개하지 않아 비교하지 않아요.</p>
    </section>
  )
}
