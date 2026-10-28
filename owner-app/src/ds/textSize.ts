// 글씨 크기 5단계 — 나이를 묻지 않고 사장님이 직접 고른다 (기본 3단계 20px)
export type TextSize = 1 | 2 | 3 | 4 | 5

export const TEXT_SIZES: Record<TextSize, { px: number; name: string }> = {
  1: { px: 16, name: '작게' },
  2: { px: 18, name: '' },
  3: { px: 20, name: '기본' },
  4: { px: 22, name: '' },
  5: { px: 24, name: '크게' },
}

export const DEFAULT_TEXT_SIZE: TextSize = 3

const CACHE_KEY = 'shima.owner.textSize'

export function isTextSize(n: number): n is TextSize {
  return Number.isInteger(n) && n >= 1 && n <= 5
}

/** 마지막으로 고른 단계 — 없거나 읽을 수 없으면 기본값 */
export function cachedTextSize(): TextSize {
  try {
    const n = Number(localStorage.getItem(CACHE_KEY))
    return isTextSize(n) ? n : DEFAULT_TEXT_SIZE
  } catch { return DEFAULT_TEXT_SIZE }
}

export function saveTextSize(size: TextSize) {
  try { localStorage.setItem(CACHE_KEY, String(size)) } catch { /* noop */ }
}

/** "3 기본 · 20px" — 단계 표기 */
export function textSizeLabel(size: TextSize): string {
  const { px, name } = TEXT_SIZES[size]
  return `${size}${name ? ` ${name}` : ''} · ${px}px`
}
