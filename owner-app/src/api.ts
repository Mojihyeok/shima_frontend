import type { StatsSummary, CustomerSummary, QrInfo, LoginResponse, MeInfo, WeekPoint, WeeklyReport, Diagnosis } from './types'
import { getToken, signalLogout } from './auth'

// 지정 없으면 "지금 접속한 호스트의 8080" — 태블릿에서 PC IP로 열어도 동작
const API_BASE =
  import.meta.env.VITE_API_BASE ?? `${window.location.protocol}//${window.location.hostname}:8080`

/** QR에 넣을 손님 웹 주소 — 지정 없으면 같은 호스트의 5174 */
export const CUSTOMER_WEB_BASE =
  import.meta.env.VITE_CUSTOMER_WEB_BASE ?? `${window.location.protocol}//${window.location.hostname}:5174`

export const customerUrl = (token: string) => `${CUSTOMER_WEB_BASE}/c/${token}`

const OWNER = `${API_BASE}/api/v1/owner`

/** 사장님 API 호출 — 토큰 자동 첨부, 401이면 로그인 화면으로 */
async function authed<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`${OWNER}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken() ?? ''}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (res.status === 401) {
    signalLogout()
    throw new Error('unauthorized')
  }
  if (!res.ok) {
    const e = await res.json().catch(() => null)
    throw new Error(e?.message ?? `API ${res.status}`)
  }
  if (res.status === 204) return null as T
  return res.json()
}

export async function login(loginId: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId, password }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.message ?? '로그인에 실패했어요.')
  }
  return res.json()
}

export const getMe = () => authed<MeInfo>('/me')
export const updateUiMode = (uiMode: 'EASY' | 'STANDARD') => authed<MeInfo>('/me/ui-mode', 'PATCH', { uiMode })

export const getSummary = () => authed<StatsSummary>('/stats/summary')
export const getToday = () => authed<CustomerSummary[]>('/customers/today')
export const getCustomers = () => authed<CustomerSummary[]>('/customers')
export const grantService = (customerId: number, rewardName: string, memo?: string) =>
  authed<{ granted: boolean }>(`/customers/${customerId}/grant`, 'POST', { rewardName, memo: memo ?? null })

/** 손님 데이터 삭제 (복구 불가) */
export const deleteCustomer = (customerId: number) => authed<null>(`/customers/${customerId}`, 'DELETE')

export const getQr = () => authed<QrInfo>('/qr')
export const getPrintQr = () => authed<QrInfo>('/qr/print')

export const getWeekly = (weeks = 8) => authed<WeekPoint[]>(`/stats/weekly?weeks=${weeks}`)
export const getWeeklyReport = (weekStart?: string) =>
  authed<WeeklyReport>(`/reports/weekly${weekStart ? `?weekStart=${weekStart}` : ''}`)

export const runDiagnosis = (body: { storeName?: string; region?: string; visitorReviewCount?: number }) =>
  authed<Diagnosis>('/diagnosis', 'POST', body)
export const getLatestDiagnosis = () => authed<Diagnosis | null>('/diagnosis/latest')
