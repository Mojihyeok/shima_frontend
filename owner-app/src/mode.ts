// 연령 적응형 모드 — 화면 구조는 하나, 디자인 토큰(index.css) + 문구 세트만 교체
export type Mode = 'EASY' | 'STANDARD'

const CACHE_KEY = 'shima.owner.mode'

/** <html data-mode="easy|standard"> 로 CSS 토큰 전환 + 다음 첫 화면을 위해 캐시 */
export function applyMode(mode: Mode) {
  document.documentElement.dataset.mode = mode === 'EASY' ? 'easy' : 'standard'
  try { localStorage.setItem(CACHE_KEY, mode) } catch { /* noop */ }
}

/** 서버 응답 전 첫 화면이 깜빡이지 않도록 마지막 모드 사용 */
export function cachedMode(): Mode {
  try { return localStorage.getItem(CACHE_KEY) === 'EASY' ? 'EASY' : 'STANDARD' } catch { return 'STANDARD' }
}

/** 음성 읽어주기 (쉬움 모드) — 브라우저 내장 TTS, 미지원이면 false */
export function speak(text: string): boolean {
  if (!('speechSynthesis' in window)) return false
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
  return true
}

interface Copy {
  modeToggle: string
  todayTitle: string
  regularsTitle: string
  grant: string
  visitNth: (n: number) => string
  emptyToday: string
  emptyRegulars: string
  delta: (d: number) => string
}

/** 용어 정책: 쉬움 = 일상어, 표준 = 간결한 업무 용어 */
export const COPY: Record<Mode, Copy> = {
  EASY: {
    modeToggle: '자세히 보기로 바꾸기',
    todayTitle: '오늘 온 손님',
    regularsTitle: '단골 손님',
    grant: '서비스 드리기',
    visitNth: (n) => `${n}번째 오셨어요`,
    emptyToday: '아직 오늘 오신 손님이 없어요.',
    emptyRegulars: '아직 단골 손님이 없어요.',
    delta: (d) =>
      d > 0 ? `지난주보다 손님이 ${d}명 늘었어요`
      : d < 0 ? `지난주보다 손님이 ${-d}명 줄었어요`
      : '지난주와 손님 수가 비슷해요',
  },
  STANDARD: {
    modeToggle: '큰 글씨로 보기',
    todayTitle: '오늘 방문',
    regularsTitle: '고객 목록',
    grant: '재량 서비스',
    visitNth: (n) => `방문 ${n}회`,
    emptyToday: '오늘 방문 기록이 없습니다.',
    emptyRegulars: '등록된 고객이 없습니다.',
    delta: (d) => `전주 대비 ${d > 0 ? '+' : ''}${d}명`,
  },
}
