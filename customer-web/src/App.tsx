import { useEffect, useState } from 'react'
import './App.css'
import { getLanding, postStamp, postWithdraw, resolveToken, type StampError } from './api'
import type { LandingResponse, StampResponse } from './types'

type Phase = 'loading' | 'input' | 'consent' | 'result' | 'error' | 'withdraw' | 'withdrawn'

const token = resolveToken()

export default function App() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [landing, setLanding] = useState<LandingResponse | null>(null)
  const [result, setResult] = useState<StampResponse | null>(null)
  const [phone, setPhone] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [inputError, setInputError] = useState('')

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

  async function submit(agreed = false) {
    if (!canSubmit || !token) return
    setSubmitting(true)
    setInputError('')
    try {
      const r = await postStamp(token, digits, agreed)
      setResult(r)
      setPhase('result')
    } catch (err) {
      const e = err as StampError
      if (e.error === 'consent_required') setPhase('consent')          // 처음 온 손님 → 동의 화면
      else if (e.error === 'bad_request') { setInputError(e.message); setPhase('input') } // 번호 형식 → 입력 화면 유지
      else { setErrorMsg(e.message ?? '적립에 실패했어요.'); setPhase('error') }
    } finally {
      setSubmitting(false)
    }
  }

  async function withdraw() {
    if (!canSubmit || !token) return
    setSubmitting(true)
    setInputError('')
    try {
      const r = await postWithdraw(token, digits)
      setErrorMsg(r.message)
      setPhone('')
      setPhase('withdrawn')
    } catch (err) {
      setInputError((err as StampError).message ?? '삭제에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setPhone('')
    setResult(null)
    setInputError('')
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

  // 처음 적립 — 개인정보 수집·이용 동의 (문구 바꾸면 백엔드 shima.privacy.consent-version도 올릴 것)
  if (phase === 'consent') {
    return (
      <main className="screen">
        <p className="store">{landing?.storeName}</p>
        <p className="title">처음 오셨네요!<br/>아래 내용에 동의해 주세요</p>
        <dl className="consent">
          <dt>모으는 정보</dt><dd>휴대폰 번호(암호화해서 저장), 방문 날짜</dd>
          <dt>쓰는 곳</dt><dd>도장 적립, 리워드 지급, 매장 방문 통계</dd>
          <dt>보관 기간</dt><dd>마지막 방문 후 1년<br/>요청하면 바로 삭제해요</dd>
        </dl>
        <p className="muted">동의하지 않으면 도장을 받을 수 없어요.</p>
        <button className="stamp-btn" disabled={submitting} onClick={() => submit(true)}>
          {submitting ? '적립 중…' : '동의하고 도장 받기'}
        </button>
        <button className="ghost-btn" onClick={reset}>동의하지 않음</button>
      </main>
    )
  }

  // 내 정보 삭제
  if (phase === 'withdraw') {
    return (
      <main className="screen">
        <p className="store">{landing?.storeName}</p>
        <p className="title">내 정보 삭제</p>
        <p className="hint">적립할 때 쓴 번호를 넣어 주세요.<br/>도장 기록도 모두 사라지고 되돌릴 수 없어요.</p>
        <input
          className="phone-input"
          type="tel"
          inputMode="numeric"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoFocus
        />
        {inputError && <p className="input-error" role="alert">{inputError}</p>}
        <button className="danger-btn" disabled={!canSubmit} onClick={withdraw}>
          {submitting ? '삭제 중…' : '삭제하기'}
        </button>
        <button className="ghost-btn" onClick={reset}>돌아가기</button>
      </main>
    )
  }

  if (phase === 'withdrawn') {
    return (
      <main className="screen">
        <p className="message">{errorMsg}</p>
        <button className="ghost-btn" onClick={reset}>처음으로</button>
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
      {inputError && <p className="input-error" role="alert">{inputError}</p>}

      <button className="stamp-btn" disabled={!canSubmit} onClick={() => submit()}>
        {submitting ? '적립 중…' : '도장 받기'}
      </button>

      {landing?.rewardName && landing.stampGoal > 0 && (
        <p className="hint">{landing.stampGoal}번 모으면 {landing.rewardName}</p>
      )}

      <button className="text-link" onClick={() => { setPhone(''); setInputError(''); setPhase('withdraw') }}>
        내 정보 삭제
      </button>
    </main>
  )
}
