import { useId, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import stepSvg from './assets/step.svg'
import knobSvg from './assets/knob.svg'
import { TEXT_SIZES, isTextSize, textSizeLabel, type TextSize } from './textSize'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }

/** Button/Primary · Button/Secondary — 높이 64 이상, 폭 가득. 버튼끼리 최소 16px 간격은 부모가 준다 */
export function Button({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={`ds-btn ${variant}${className ? ` ${className}` : ''}`} {...rest} />
}

/** Bubble/쉬마 — 쉬마의 말풍선 */
export function Bubble({ speaker = '쉬마', children }: { speaker?: string; children: ReactNode }) {
  return (
    <div className="ds-bubble">
      <p className="ds-bubble-name">{speaker}</p>
      <p className="ds-bubble-text">{children}</p>
    </div>
  )
}

/** Chip/근거 — 모든 분석·문구에 붙는 근거 표시 */
export function EvidenceChip({ children }: { children: ReactNode }) {
  return <span className="ds-chip">{children}</span>
}

/** Card/숫자 — 첫 진단의 숫자 하나 = 카드 하나 */
export function StatCard({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="ds-card">
      <p className="ds-card-label">{label}</p>
      <p className="ds-card-value">{value}</p>
      {sub && <p className="ds-card-sub">{sub}</p>}
    </div>
  )
}

/** ProgressBar — 진행률(0~100)과 지금 하는 일을 글로 함께 */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.min(100, Math.max(0, value)))
  return (
    <div className="ds-progress">
      <p className="ds-progress-label" aria-hidden>{pct}% · {label}</p>
      <div className="ds-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${pct}%, ${label}`}>
        <div className="ds-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const STEPS = Object.keys(TEXT_SIZES).map(Number) as TextSize[]

/** TextSizeBar — 글씨 크기 5단계. 오른쪽으로 밀수록 커짐 */
export function TextSizeBar({ value, onChange }: { value: TextSize; onChange: (size: TextSize) => void }) {
  const labelId = useId()
  const at = (s: TextSize) => `${((s - 1) / (STEPS.length - 1)) * 100}%`
  // 채움은 손잡이 중심까지 — 단계 영역이 좌우 18px 안쪽이라 그만큼 보정
  const activeWidth: CSSProperties = { width: `calc(18px + (100% - 36px) * ${(value - 1) / (STEPS.length - 1)})` }

  return (
    <div className="ds-textsize">
      <p className="ds-textsize-label" id={labelId}>글씨 크기</p>
      <div className="ds-textsize-row">
        <span className="ds-textsize-min" aria-hidden>가</span>
        <div className="ds-slider">
          <div className="ds-slider-rail" />
          <div className="ds-slider-active" style={activeWidth} />
          <input
            className="ds-slider-input" type="range" min={1} max={5} step={1} value={value}
            aria-labelledby={labelId} aria-valuetext={textSizeLabel(value)}
            onChange={(e) => { const n = Number(e.target.value); if (isTextSize(n)) onChange(n) }}
          />
          <div className="ds-slider-stops">
            {STEPS.map((s) => <img key={s} className="ds-slider-step" src={stepSvg} width={6} height={6} alt="" style={{ left: at(s) }} />)}
            <img className="ds-slider-knob" src={knobSvg} width={36} height={36} alt="" style={{ left: at(value) }} />
          </div>
        </div>
        <span className="ds-textsize-max" aria-hidden>가</span>
      </div>
    </div>
  )
}
