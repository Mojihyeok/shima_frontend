import { useEffect, useState } from 'react'
import './App.css'
import { getLanding, postStamp, resolveToken } from './api'
import type { LandingResponse, StampResponse } from './types'

type Phase = 'loading' | 'input' | 'result' | 'error'

const token = resolveToken()

export default function App() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [landing, setLanding] = useState<LandingResponse | null>(null)
  const [result, setResult] = useState<StampResponse | null>(null)
  const [phone, setPhone] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setErrorMsg('QR 코드를 다시 찍어 주세요.')
      setPhase('error')
      return
    }
    getLanding(token)
      .then((l) => { setLanding(l); setPhase('input') })
      .catch((e) => { setErrorMsg(e.message ?? '문제가 생겼어요.'); setPhase('error') })
  }, [])

  const digits = phone.replace(/\D/g, '')
  const canSubmit = digits.length >= 10 && !submitting

  async function submit() {
    if (!canSubmit || !token) return
    setSubmitting(true)
    try {
      const r = await postStamp(token, digits)
      setResult(r)
      setPhase('result')
    } catch (e: any) {
      setErrorMsg(e.message ?? '적립에 실패했어요.')
      setPhase('error')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setPhone('')
    setResult(null)
    setPhase('input')
  }

  if (phase === 'loading') {
    return <main className="screen"><p className="muted">불러오는 중…</p></main>
  }

  if (phase === 'error') {
    return (
      <main className="screen">
        <div className="big-emoji">😥</div>
        <p className="message">{errorMsg}</p>
        <p className="muted">매장에 문의해 주세요.</p>
      </main>
    )
  }

  if (phase === 'result' && result) {
    return (
      <main className="screen">
        <p className="store">{result.storeName}</p>

        {result.rewardReached ? (
          <>
            <div className="big-emoji">🎉</div>
            <p className="reward-hit">{result.rewardName} 받으세요!</p>
          </>
        ) : result.alreadyStampedToday ? (
          <p className="today">오늘은 이미 도장을 받았어요</p>
        ) : (
          <p className="today">도장을 받았어요</p>
        )}

        <div className="count-wrap">
          <span className="count">{result.stamps}</span>
          <span className="count-unit">개</span>
        </div>

        {result.stampGoal > 0 && !result.rewardReached && (
          <p className="remaining">
            <b>{result.remaining}</b>번 더 오면 <b>{result.rewardName}</b>
          </p>
        )}

        <button className="ghost-btn" onClick={reset}>처음으로</button>
      </main>
    )
  }

  // input
  return (
    <main className="screen">
      <p className="store">{landing?.storeName}</p>
      <p className="title">전화번호를 넣고<br/>도장을 받으세요</p>

      <input
        className="phone-input"
        type="tel"
        inputMode="numeric"
        placeholder="010-0000-0000"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
        autoFocus
      />

      <button className="stamp-btn" disabled={!canSubmit} onClick={submit}>
        {submitting ? '적립 중…' : '도장 받기'}
      </button>

      {landing?.rewardName && landing.stampGoal > 0 && (
        <p className="hint">{landing.stampGoal}번 모으면 {landing.rewardName}</p>
      )}
    </main>
  )
}
