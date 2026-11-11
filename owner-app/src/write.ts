/** 글 주제 — 값은 백엔드 WriterService.TOPICS와 맞출 것 */
export const TOPICS: { value: string; label: string; placeholder: string }[] = [
  { value: 'today', label: '오늘 소식', placeholder: '예: 오늘 딸기 케이크 새로 구웠어요' },
  { value: 'new_menu', label: '신메뉴', placeholder: '예: 흑임자 라떼 새로 나왔어요, 고소하고 덜 달아요' },
  { value: 'mood', label: '가게 분위기', placeholder: '예: 창가 자리 넓고 콘센트 많아요' },
  { value: 'thanks', label: '단골 감사', placeholder: '예: 시험 기간 응원해요' },
  { value: 'stamp', label: '도장 혜택', placeholder: '예: 계산대 QR 찍으면 바로 적립돼요' },
  { value: 'free', label: '자유 주제', placeholder: '하고 싶은 말을 편하게 적어 주세요 (필수)' },
]

/** 해시 주소의 ?ch=instagram&topic=today 읽기 */
export function hashParams(): URLSearchParams {
  const h = window.location.hash
  const i = h.indexOf('?')
  return new URLSearchParams(i >= 0 ? h.slice(i + 1) : '')
}
