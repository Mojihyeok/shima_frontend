import type { StatsSummary, CustomerSummary, QrInfo, LoginResponse, MeInfo, WeekPoint, WeeklyReport, Diagnosis, DailyCount, PocMetrics, AtRiskCustomer, MarketingAction, AiMention, Coach, HourlyStats, WriteResult, StoreProfile } from './types'
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
export const getAtRisk = (limit = 50) => authed<AtRiskCustomer[]>(`/customers/at-risk?limit=${limit}`)
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

// ===== PoC 측정 =====
export const getDailyCount = (date?: string) =>
  authed<DailyCount>(`/daily-visitors${date ? `?date=${date}` : ''}`)
export const setDailyCount = (count: number, date?: string) =>
  authed<DailyCount>('/daily-visitors', 'PUT', { count, date: date ?? null })

/** 화면 열람 기록 — 실패해도 화면에는 영향 없음 */
export const logEvent = (type: 'REPORT_VIEW' | 'DIAGNOSIS_VIEW') => {
  authed<null>('/events', 'POST', { type }).catch(() => undefined)
}

export const getPocMetrics = (from?: string, to?: string) => {
  const q = new URLSearchParams()
  if (from) q.set('from', from)
  if (to) q.set('to', to)
  const qs = q.toString()
  return authed<PocMetrics>(`/poc${qs ? `?${qs}` : ''}`)
}

// ===== 마케팅 실행 기록 =====
export const getActions = () => authed<MarketingAction[]>('/actions')
export const addAction = (actionType: string, date?: string, memo?: string) =>
  authed<MarketingAction>('/actions', 'POST', { actionType, date: date ?? null, memo: memo || null })
export const deleteAction = (id: number) => authed<null>(`/actions/${id}`, 'DELETE')

// ===== AI 언급률 (진단 참고 지표) =====
export const runAiCheck = () => authed<AiMention>('/diagnosis/ai-check', 'POST')
export const getLatestAiCheck = () => authed<AiMention | null>('/diagnosis/ai-check/latest')

// ===== AI 처방 (이번 주 할 일) =====
export const getCoach = () => authed<Coach | null>('/coach/current')
export const newCoach = () => authed<Coach>('/coach', 'POST')
export const coachDone = (id: number, chosenDraft: number | null) =>
  authed<Coach>(`/coach/${id}/done`, 'POST', { chosenDraft })
export const coachSkip = (id: number) => authed<Coach>(`/coach/${id}/skip`, 'POST')

// ===== 시간대별 방문 =====
export const getHourly = (weeks = 4) => authed<HourlyStats>(`/stats/hourly?weeks=${weeks}`)

// ===== SNS 글 대신 쓰기 =====
export const writePost = (channel: 'instagram' | 'blog', topic: string, note: string) =>
  authed<WriteResult>('/write', 'POST', { channel, topic, note: note || null })

// ===== 우리 가게 이야기 =====
export const getProfile = () => authed<StoreProfile>('/profile')
export const saveProfile = (ownerGoal: string, storeNotes: string) =>
  authed<StoreProfile>('/profile', 'PUT', { ownerGoal, storeNotes })
