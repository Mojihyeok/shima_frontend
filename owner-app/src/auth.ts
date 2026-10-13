// 사장님 액세스 토큰 보관 (매장 태블릿에서 재로그인 줄이기 위해 localStorage)
const KEY = 'shima.owner.token'

export function getToken(): string | null {
  try { return localStorage.getItem(KEY) } catch { return null }
}
export function setToken(token: string) {
  try { localStorage.setItem(KEY, token) } catch { /* 저장 불가 환경 — 이번 세션만 유지 */ }
}
export function clearToken() {
  try { localStorage.removeItem(KEY) } catch { /* noop */ }
}
/** 로그아웃/토큰 만료를 앱 전체에 알림 */
export function signalLogout() {
  clearToken()
  window.dispatchEvent(new Event('shima:logout'))
}
