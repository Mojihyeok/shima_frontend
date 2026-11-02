import { addDays, parseDay } from './dates'

/** 마케팅 기록 종류 — 값은 백엔드 MarketingService.TYPES와 맞출 것 */
export const ACTION_TYPES: { value: string; label: string }[] = [
  { value: 'instagram_post', label: '인스타 게시물' },
  { value: 'blog_review', label: '블로그·체험단' },
  { value: 'message', label: '문자·카톡 안내' },
  { value: 'event', label: '이벤트·할인' },
  { value: 'naver_place', label: '네이버 플레이스 수정' },
  { value: 'flyer', label: '전단·현수막' },
  { value: 'other', label: '기타' },
]

export const actionLabel = (type: string) => ACTION_TYPES.find((t) => t.value === type)?.label ?? type

/** 'YYYY-MM-DD' → 그 주 월요일 'YYYY-MM-DD' (백엔드 주 시작과 동일) */
export function weekStartOf(day: string): string {
  const dow = parseDay(day).getDay() // 0=일 … 6=토
  return addDays(day, dow === 0 ? -6 : 1 - dow)
}

/** 오늘 (한국 날짜) 'YYYY-MM-DD' */
export const todayKst = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
