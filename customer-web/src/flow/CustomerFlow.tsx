import { useEffect, useState } from 'react'
import './flow.css'
import stampOn from './assets/stamp-on.svg'
import stampOff from './assets/stamp-off.png'

// 손님 흐름 (Figma "02 손님 흐름") — 화면 하나 = 해시 하나 (#/flow/c1 …), 데이터는 목업
// 리뷰는 보상 없이 권하기만 한다 (네이버 리뷰 정책·광고 표시 규정). 도장·쿠폰은 리뷰와 상관없이 준다
type Step = 'c1' | 'c2' | 'c3'
const STEPS: Step[] = ['c1', 'c2', 'c3']

function stepFromHash(hash: string): Step {
  const s = hash.replace(/^#\/flow\/?/, '')
  return (STEPS as string[]).includes(s) ? (s as Step) : 'c1'
}

function go(step: Step) {
  window.location.hash = `#/flow/${step}`
  window.scrollTo(0, 0)
}

const STORE = '카페 아로'
const STAMP_GOAL = 10
const STAMPS = 4 // 오늘 찍은 것 포함
const REWARD = '아메리카노 1잔'
const SOURCES = ['네이버 지도', '인스타그램', '지나가다가', '지인 추천'] as const

export default function CustomerFlow() {
  const [hash, setHash] = useState(window.location.hash)
  const [source, setSource] = useState<string | null>(null)

  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const step = stepFromHash(hash)
  return (
    <div className="cflow">
      {step === 'c1' && <C1 stamps={STAMPS} />}
      {step === 'c2' && <C2 visits={STAMPS} source={source} onSource={setSource} />}
      {step === 'c3' && <C3 />}
    </div>
  )
}

/** C1 QR 적립 — 앱 설치·회원가입 없이 바로 도장 */
function C1({ stamps }: { stamps: number }) {
  return (
    <main className="cflow-screen animate-flow-in motion-reduce:animate-none">
      <p className="cflow-store">{STORE}</p>
      <h1 className="cflow-title">도장 1개 찍었어요</h1>
      <div className="cflow-stamps" role="img" aria-label={`도장 ${STAMP_GOAL}개 중 ${stamps}개`}>
        {Array.from({ length: STAMP_GOAL }, (_, i) => (
          <img key={i} src={i < stamps ? stampOn : stampOff} width={50} height={50} alt="" />
        ))}
      </div>
      <p className="cflow-goal">{STAMP_GOAL - stamps}개 더 모으면 {REWARD}</p>
      <p className="cflow-foot">가입 없이 전화번호 뒷자리 4개로 쌓여요</p>
      <div className="cflow-spacer" />
      <button type="button" className="cflow-btn primary" onClick={() => go('c2')}>혜택 더 보기</button>
    </main>
  )
}

/** C2 쿠폰·다양한 혜택 — "어디서 보고 오셨어요?"를 한 번만 물어 유입 경로를 남긴다 */
function C2({ visits, source, onSource }: { visits: number; source: string | null; onSource: (s: string) => void }) {
  return (
    <main className="cflow-screen tight animate-flow-in motion-reduce:animate-none">
      <h1 className="cflow-title sm">오늘 받을 수 있는 혜택</h1>
      <div className="cflow-coupon">
        <div className="cflow-coupon-body">
          <p className="cflow-coupon-tag">오늘만</p>
          <p className="cflow-coupon-name">크로플 500원 할인</p>
          <p className="cflow-coupon-note">계산할 때 이 화면을 보여주세요</p>
        </div>
      </div>
      <div className="cflow-coupon">
        <div className="cflow-coupon-body">
          <p className="cflow-coupon-tag">단골 혜택</p>
          <p className="cflow-coupon-name">5번째 방문 음료 사이즈업</p>
          <p className="cflow-coupon-note">지금 {visits}번째 방문이에요</p>
        </div>
      </div>
      <p className="cflow-question" id="cflow-source">어디서 보고 오셨어요? (한 번만 물어봐요)</p>
      <div className="cflow-pills" role="group" aria-labelledby="cflow-source">
        {SOURCES.map((s) => (
          <button key={s} type="button" className="cflow-pill" aria-pressed={s === source} onClick={() => onSource(s)}>{s}</button>
        ))}
      </div>
      <div className="cflow-spacer" />
      <button type="button" className="cflow-btn primary" onClick={() => go('c3')}>다음</button>
    </main>
  )
}

/** C3 네이버 리뷰 (선택) — 혜택을 다 받은 뒤 마지막에, 대가 없이 권하기만 */
function C3() {
  const reviewUrl = `https://map.naver.com/p/search/${encodeURIComponent(STORE)}`
  return (
    <main className="cflow-screen animate-flow-in motion-reduce:animate-none">
      <h1 className="cflow-title">오늘 어떠셨어요?</h1>
      <p className="cflow-lead">남겨주신 리뷰는 사장님께 큰 힘이 돼요.</p>
      <div className="cflow-spacer" />
      <p className="cflow-foot">리뷰를 쓰지 않아도 도장과 쿠폰은 그대로예요.</p>
      <div className="cflow-buttons">
        <a className="cflow-btn primary" href={reviewUrl} target="_blank" rel="noreferrer">네이버에 리뷰 남기기</a>
        <button type="button" className="cflow-btn secondary" onClick={() => go('c1')}>괜찮아요</button>
      </div>
    </main>
  )
}
