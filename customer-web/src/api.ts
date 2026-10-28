import type { LandingResponse, StampResponse } from './types'

// 백엔드 주소: 지정 없으면 "지금 접속한 호스트의 8080" — 폰에서 PC IP로 접속해도 그대로 동작
const API_BASE =
  import.meta.env.VITE_API_BASE ?? `${window.location.protocol}//${window.location.hostname}:8080`

/**
 * QR URL에서 토큰 추출.
 *  - 정식: /c/{token}   (QR에 인코딩되는 형태)
 *  - 보조: ?token={token}
 *  - 개발 모드에서 루트(/)로 들어오면 demo-token
 * 토큰이 없으면 null → "QR을 다시 찍어 주세요" 안내
 */
export function resolveToken(): string | null {
  const m = window.location.pathname.match(/^\/c\/([A-Za-z0-9_-]+)\/?$/)
  if (m) return m[1]
  const q = new URLSearchParams(window.location.search).get('token')
  if (q) return q
  if (import.meta.env.DEV && window.location.pathname === '/') return 'demo-token'
  return null
}

export async function getLanding(token: string): Promise<LandingResponse> {
  const res = await fetch(`${API_BASE}/api/v1/c/${token}`)
  if (!res.ok) throw await res.json().catch(() => ({ message: '진입할 수 없어요.' }))
  return res.json()
}

/** 적립 실패 시 던지는 오류 — error 코드로 분기 (consent_required → 동의 화면) */
export interface StampError { error?: string; message: string }

export async function postStamp(token: string, phone: string, agreed = false): Promise<StampResponse> {
  const res = await fetch(`${API_BASE}/api/v1/c/${token}/stamp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agreed ? { phone, agreed: true } : { phone }),
  })
  if (!res.ok) throw (await res.json().catch(() => ({ message: '적립에 실패했어요.' }))) as StampError
  return res.json()
}

/** 내 정보 삭제 — 등록 여부와 관계없이 같은 응답 */
export async function postWithdraw(token: string, phone: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/c/${token}/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  if (!res.ok) throw (await res.json().catch(() => ({ message: '삭제에 실패했어요.' }))) as StampError
  return res.json()
}
