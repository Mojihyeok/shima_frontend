import type { CSSProperties } from 'react'

// 글씨 크기 — 사장님이 1px 단위로 세밀하게 고른다 (16~24px, 기본 20px)
export const MIN_TEXT_PX = 16
export const MAX_TEXT_PX = 24
export const DEFAULT_TEXT_PX = 20

// Figma 원안의 5단계 — 트랙 위 눈금으로 남겨두되, 실제 조절은 그 사이도 1px 단위로 고를 수 있다
export const TEXT_PRESETS = [
  { px: 16, name: '작게' },
  { px: 18, name: '' },
  { px: 20, name: '기본' },
  { px: 22, name: '' },
  { px: 24, name: '크게' },
] as const

const CACHE_KEY = 'shima.owner.textSize'

function isTextPx(n: number): boolean {
  return Number.isInteger(n) && n >= MIN_TEXT_PX && n <= MAX_TEXT_PX
}

/** 마지막으로 고른 크기(px) — 없거나 읽을 수 없으면 기본값 */
export function cachedTextPx(): number {
  try {
    const n = Number(localStorage.getItem(CACHE_KEY))
    return isTextPx(n) ? n : DEFAULT_TEXT_PX
  } catch { return DEFAULT_TEXT_PX }
}

export function saveTextPx(px: number) {
  try { localStorage.setItem(CACHE_KEY, String(px)) } catch { /* noop */ }
}

/** --text-scale 배율 — 기본 20px을 1로 */
export function textScale(px: number): number {
  return px / DEFAULT_TEXT_PX
}

/** .ds 루트에 꽂는 인라인 스타일 — --text-scale이 바뀌면 ds.css의 @property 트랜지션이
 *  자식 요소 font-size까지 한 번에 부드럽게 보간한다 (요소마다 transition을 안 붙여도 됨) */
export function textScaleStyle(px: number): CSSProperties {
  return { '--text-scale': textScale(px) } as CSSProperties
}

/** "20px" — 슬라이더 값 표기(스크린리더용) */
export function textSizeLabel(px: number): string {
  return `${px}px`
}

/** "작게 · 16px" / "18px" — 프리셋 카드 표기 */
export function presetLabel(preset: typeof TEXT_PRESETS[number]): string {
  return preset.name ? `${preset.name} · ${preset.px}px` : `${preset.px}px`
}
