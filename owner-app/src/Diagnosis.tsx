import { useEffect, useState, type FormEvent } from 'react'
import { getMe, getLatestDiagnosis, runDiagnosis } from './api'
import type { Diagnosis as Result } from './types'
import { applyMode, cachedMode, speak, type Mode } from './mode'

/** 온라인 진단 — 쉬마 브랜드 지수 (5축, 규칙 기반). 측정 못 한 축은 이유와 함께 표시 */
export default function Diagnosis() {
  const [mode, setMode] = useState<Mode>(cachedMode())
  const [storeName, setStoreName] = useState('')
  const [region, setRegion] = useState('')
  const [reviews, setReviews] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getMe().then((m) => { setMode(m.uiMode); applyMode(m.uiMode); setStoreName((v) => v || m.storeName) }).catch(() => {})
    getLatestDiagnosis().then((r) => r && setResult(r)).catch(() => {})
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const n = reviews.trim() === '' ? undefined : Math.max(0, Number(reviews))
      setResult(await runDiagnosis({
        storeName: storeName.trim() || undefined,
        region: region.trim() || undefined,
        visitorReviewCount: Number.isFinite(n) ? n : undefined,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '진단에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  const easy = mode === 'EASY'
  const measuredCount = result?.axes.filter((a) => a.measured).length ?? 0
  const diff = result && result.previousScore !== null ? result.totalScore - result.previousScore : null

  function spokenText(r: Result) {
    const parts = [`우리 가게 쉬마 지수는 100점 중 ${r.totalScore}점이에요.`]
    for (const a of r.axes) {
      parts.push(a.measured ? `${a.easyName}, ${a.max}점 중 ${a.points}점.` : `${a.easyName}는 아직 재지 못했어요.`)
    }
    return parts.join(' ')
  }

  return (
    <main className="wrap">
      <a className="back-link" href="#/">← 대시보드</a>
      <h1 className="brand">{easy ? '우리 가게 진단' : '온라인 진단'} <span className="sub">쉬마 지수</span></h1>

      <form className="card diag-form" onSubmit={submit}>
        <label className="field">상호명
          <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="예: 아로새길" />
        </label>
        <label className="field">지역 <span className="hint">(시·구·동 — 비우면 매장 등록 지역)</span>
          <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="예: 수원 영통구" />
        </label>
        <label className="field">네이버 지도 방문자 리뷰 수 <span className="hint">(선택)</span>
          <input value={reviews} onChange={(e) => setReviews(e.target.value.replace(/\D/g, ''))}
                 inputMode="numeric" placeholder="예: 37" />
          <span className="hint">리뷰 수는 네이버가 공개하지 않아서, 네이버 지도에서 우리 가게를 찾아 숫자를 적어 주세요.</span>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="give-btn wide" disabled={busy}>{busy ? '네이버에서 확인하는 중…' : (result ? '다시 진단하기' : '진단하기')}</button>
      </form>

      {result && (
        <>
          <section className="card score-hero">
            <p className="score-label">쉬마 지수</p>
            <p className="score-num">{result.totalScore}<span>/100</span></p>
            {diff !== null && (
              <p className={`delta ${diff >= 0 ? 'up' : 'down'}`}>
                {diff === 0 ? '지난 진단과 같아요' : `지난 진단보다 ${diff > 0 ? '+' : ''}${diff}점`}
                {diff !== 0 && <span aria-hidden="true">{diff > 0 ? ' ↑' : ' ↓'}</span>}
              </p>
            )}
            <p className="hint">
              {measuredCount < 5 ? `5개 중 ${measuredCount}개 항목으로 계산했어요 · ` : ''}
              {new Date(result.createdAt).toLocaleDateString('ko-KR')} 진단
            </p>
            {result.placeTitle
              ? <p className="hint">네이버에서 찾은 가게: <b>{result.placeTitle}</b>{result.placeAddress ? ` · ${result.placeAddress}` : ''}</p>
              : <p className="error">네이버 지도에서 가게를 찾지 못했어요. 상호명·지역을 확인해 주세요.</p>}
            {easy && <button className="speak-btn" onClick={() => speak(spokenText(result))}>🔊 읽어주기</button>}
          </section>

          <section className="card">
            <ul className="axis-list">
              {result.axes.map((a) => (
                <li key={a.key} className={`axis ${a.measured ? '' : 'unmeasured'}`}>
                  <div className="axis-head">
                    <span className="axis-name">{easy ? a.easyName : `${a.name} (${a.techName})`}</span>
                    <span className="axis-score">{a.measured ? <><b>{a.points}</b> / {a.max}점</> : '측정 안 됨'}</span>
                  </div>
                  {a.measured && (
                    <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={a.max} aria-valuenow={a.points}
                         aria-label={`${a.name} ${a.points}점 / ${a.max}점`}>
                      <div className="meter-fill" style={{ width: `${(a.points / a.max) * 100}%` }} />
                    </div>
                  )}
                  <ul className="evidence">
                    {a.evidence.map((e) => <li key={e}>{e}</li>)}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <p className="footnote">
        점수는 AI가 아니라 정해진 규칙으로 계산해요(같은 데이터면 항상 같은 점수). 네이버 공식 검색 API로 확인할 수 있는 것과
        쉬마 적립 기록만 사용하고, 확인할 수 없는 항목은 0점이 아니라 계산에서 빼요.
      </p>
    </main>
  )
}
