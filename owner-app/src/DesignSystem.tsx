import { useState } from 'react'
import './ds/ds.css'
import { Bubble, Button, EvidenceChip, ProgressBar, StatCard, TextSizeBar } from './ds/components'
import { TEXT_PRESETS, cachedTextPx, presetLabel, saveTextPx, textScaleStyle } from './ds/textSize'

const SWATCHES = [
  { token: 'primary', hex: '#79CCFD', desc: '쉬마 메인 · 버튼·진행바·강조 면' },
  { token: 'bg', hex: '#FFF9F0', desc: '쉬마 메인 · 화면 배경(크림)' },
  { token: 'primary-deep', hex: '#1F6FA6', desc: '강조 글씨 · 크림 위 대비 5.1:1' },
  { token: 'primary-soft', hex: '#E3F4FF', desc: '근거 칩·선택 상태 배경' },
  { token: 'text', hex: '#1F2A33', desc: '본문 · #79CCFD 위 대비 8.3:1' },
  { token: 'text-sub', hex: '#5B6670', desc: '보조 글씨' },
  { token: 'line', hex: '#E6DED2', desc: '테두리·구분선' },
]

const RULES = [
  '버튼 높이 64px 이상, 화면 폭 가득',
  '작은 요소(체크, 슬라이더 손잡이)도 터치 영역 48px 이상',
  '버튼 사이 간격 최소 16px — 잘못 누르기 방지',
  '한 화면에 결정 하나, 버튼은 최대 3개',
  '주 버튼은 엄지가 닿는 화면 아래쪽에',
]

/** 디자인 시스템 확인 페이지 (#/design-system) — Figma "03 디자인 시스템" 시트. 글씨 크기를 바꾸면 아래 컴포넌트가 함께 커진다 */
export default function DesignSystem() {
  const [size, setSize] = useState<number>(cachedTextPx())
  const choose = (px: number) => { setSize(px); saveTextPx(px) }

  return (
    <main className="ds ds-sheet" style={textScaleStyle(size)}>
      <h1 className="ds-sheet-title">03 디자인 시스템</h1>
      <p className="ds-sheet-sub">{'메인 컬러 #79CCFD · #FFF9F0  |  글씨 크기는 사장님이 바로 고르고, 터치 영역은 크게·간격은 확실하게'}</p>

      <div className="ds-sheet-cols">
        <div className="ds-sheet-col">
          <section>
            <h2 className="ds-sheet-h2">컬러</h2>
            <div className="ds-swatches">
              {SWATCHES.map((c) => (
                <div key={c.token} className="ds-swatch">
                  <div className="ds-swatch-chip" style={{ background: `var(--color-${c.token})` }} />
                  <p className="ds-swatch-name">{`${c.token}  ${c.hex}`}</p>
                  <p className="ds-swatch-desc">{c.desc}</p>
                </div>
              ))}
            </div>
            <p className="ds-sheet-note">주의: #79CCFD 버튼 위 글씨는 흰색 금지 (대비 1.8:1). 진한 남색 #1F2A33을 쓴다.</p>
          </section>

          <section className="ds-type">
            <h2 className="ds-sheet-h2">글씨 크기 — 사장님이 바로 고르는 5단계</h2>
            <div className="ds-type-steps">
              {TEXT_PRESETS.map((p) => (
                <button key={p.px} type="button" className="ds-type-step" aria-pressed={p.px === size} onClick={() => choose(p.px)}>
                  <span className="ds-type-step-label">{presetLabel(p)}</span>
                  <span style={{ fontSize: p.px }}>사장님, 이번 주 손님이 늘었어요</span>
                </button>
              ))}
            </div>
            <div className="ds-textsize-demo">
              <TextSizeBar value={size} onChange={choose} />
              <p className="ds-textsize-note">{'← 왼쪽: 작게   오른쪽: 크게 →   제목·숫자도 같은 비율로 함께 커짐. 온보딩 첫 화면에서 고르고, 상단에서 언제든 다시 조절.'}</p>
            </div>
          </section>
        </div>

        <section className="ds-sheet-col">
          <h2 className="ds-sheet-h2">터치 영역 — 크게, 간격은 확실하게</h2>
          <div className="ds-panel ds-touch">
            <Button>올려주세요</Button>
            <p className="ds-gap-marker">간격 최소 16px (버튼끼리 붙지 않게)</p>
            <Button variant="secondary">다음에 할게요</Button>
            <ul className="ds-rules">
              {RULES.map((r) => <li key={r}>· {r}</li>)}
            </ul>
          </div>
        </section>
      </div>

      <section className="ds-components">
        <h2 className="ds-sheet-h2">컴포넌트</h2>
        <div className="ds-panel">
          <div className="ds-slot w-wide">
            <p className="ds-slot-caption">Button/Primary</p>
            <Button>올려주세요</Button>
          </div>
          <div className="ds-slot w-wide">
            <p className="ds-slot-caption">Button/Secondary</p>
            <Button variant="secondary">다음에 할게요</Button>
          </div>
          <div className="ds-slot w-wide">
            <p className="ds-slot-caption">Bubble/쉬마</p>
            <Bubble>사장님, 안녕하세요. 쉬마예요.</Bubble>
          </div>
          <div className="ds-slot">
            <p className="ds-slot-caption">Chip/근거</p>
            <EvidenceChip>리뷰 23개에서 나온 말이에요</EvidenceChip>
          </div>
          <div className="ds-slot w-card">
            <p className="ds-slot-caption">Card/숫자</p>
            <StatCard label="네이버 별점" value="4.6" sub="리뷰 128개" />
          </div>
          <div className="ds-slot w-wide">
            <p className="ds-slot-caption">ProgressBar</p>
            <ProgressBar value={62} label="리뷰 읽는 중" />
          </div>
          <div className="ds-slot w-wide">
            <p className="ds-slot-caption">TextSizeBar</p>
            <TextSizeBar value={size} onChange={choose} />
          </div>
        </div>
      </section>
    </main>
  )
}
