import { useEffect, useState } from 'react'
import { getLatestAiCheck, runAiCheck } from './api'
import type { AiMention } from './types'

/**
 * AI 언급률 — 구글 검색이 되는 AI(Gemini)에게 손님처럼 "동네 + 업종 추천"을 물어보고 우리 가게가 나오는지.
 * 답변을 보여줄 때는 구글 검색 제안(search suggestions)을 함께 표시 (Gemini API 약관) — 샌드박스 iframe으로 격리.
 * 답이 매번 달라서 쉬마 지수에는 넣지 않는 참고 지표. 하루 3번 제한 (비용).
 */
export default function AiMentionCard({ easy }: { easy: boolean }) {
  const [r, setR] = useState<AiMention | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getLatestAiCheck().then((x) => x && setR(x)).catch(() => {})
  }, [])

  async function run() {
    setBusy(true); setError('')
    try {
      setR(await runAiCheck())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI에게 물어보지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <h2 className="card-title">
        {easy ? 'AI가 우리 가게를 추천할까?' : 'AI 언급률'} <span className="card-sub">참고용 · 점수에 포함 안 됨</span>
      </h2>
      <p className="muted">
        {easy ? '손님처럼 AI에게 동네 가게를 물어보고, 우리 가게 이름이 나오는지 확인해요.'
              : '구글 검색이 되는 AI(Gemini)에게 "동네 + 업종 추천"을 3번 묻고 가게 이름이 나온 횟수를 셉니다. 같은 질문에도 답이 달라질 수 있어요.'}
      </p>

      {r && (
        <>
          <p className="ai-result">
            AI에게 {r.asked}번 물어봤더니 <b>{r.mentioned}번</b> 우리 가게를 말했어요
          </p>
          {!easy && (
            <ul className="ai-items">
              {r.items.map((it) => (
                <li key={it.question}>
                  <details>
                    <summary>
                      <span className={it.mentioned ? 'poc-ok' : 'poc-ng'}>{it.mentioned ? '✓ 언급' : '✗ 없음'}</span> “{it.question}”
                    </summary>
                    <p className="ai-excerpt">{it.answerExcerpt || '(답변 없음)'}</p>
                    {it.searchSuggestionsHtml && (
                      <iframe className="ai-suggest" title="Google 검색 제안" sandbox="allow-popups allow-popups-to-escape-sandbox"
                              srcDoc={it.searchSuggestionsHtml} />
                    )}
                  </details>
                </li>
              ))}
            </ul>
          )}
          <p className="hint">{new Date(r.checkedAt).toLocaleString('ko-KR')} 확인{easy ? '' : ` · ${r.model}`}</p>
        </>
      )}

      {error && <p className="error">{error}</p>}
      <button className="give-btn wide" onClick={run} disabled={busy}>
        {busy ? 'AI에게 물어보는 중… (30초~1분)' : r ? '다시 물어보기' : 'AI에게 물어보기'}
      </button>
    </section>
  )
}
