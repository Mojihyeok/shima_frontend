export interface StatsSummary {
  newThisWeek: number
  revisitThisWeek: number
  visitorsThisWeek: number
  visitorsLastWeek: number
  deltaVisitors: number
}

export interface CustomerSummary {
  customerId: number
  phoneLast4: string
  name: string | null
  visitCount: number
  firstVisitAt: string | null
  lastVisitAt: string | null
}

export interface QrInfo {
  storeName: string
  token: string
  kind: 'ROTATING' | 'PRINT'
  expiresAt: string
}

export interface LoginResponse {
  accessToken: string
  storeName: string
  uiMode: 'EASY' | 'STANDARD'
}

export interface MeInfo {
  loginId: string
  storeName: string
  uiMode: 'EASY' | 'STANDARD'
}

export interface WeekPoint {
  weekStart: string   // YYYY-MM-DD (월요일)
  newCount: number
  revisitCount: number
  inProgress: boolean
}

export interface WeeklyReport {
  weekStart: string
  weekEnd: string
  inProgress: boolean
  newCount: number
  revisitCount: number
  visitors: number
  prevVisitors: number
  changePct: number | null
  revisitRate: number | null
  avgCycleDays: number | null
  rewardsAuto: number
  rewardsManual: number
}

export interface DiagnosisAxis {
  key: 'exposure' | 'aeo' | 'reputation' | 'activity' | 'completeness' | 'revisit'
  name: string
  easyName: string
  techName: string
  points: number
  max: number
  measured: boolean
  evidence: string[]
}

export interface Diagnosis {
  createdAt: string
  totalScore: number
  measuredMax: number
  placeTitle: string | null
  placeAddress: string | null
  searchKeyword: string | null
  axes: DiagnosisAxis[]
  previousScore: number | null
  /** 같은 검색어 상위 가게와 비교 (self = 우리 가게). 예전 진단은 null */
  peers: DiagnosisPeer[] | null
}

export interface DiagnosisPeer {
  name: string
  blogMentions: number
  recentPosts30: number
  self: boolean
  /** false = 블로그에서 이름을 못 찾아 중앙값 계산에서 뺀 가게 (예전 진단은 없음) */
  counted?: boolean
}

/** 하루 전체 손님 수 (count null = 아직 입력 안 함) */
export interface DailyCount {
  date: string
  count: number | null
}

/** PoC 성공 지표 — 백엔드 PocMetrics와 1:1 */
export interface PocMetrics {
  from: string
  to: string
  qrVisits: number
  daysWithCount: number
  enteredVisitors: number
  qrVisitsOnCountedDays: number
  participationRate: number | null
  timedStamps: number
  medianStampSeconds: number | null
  p90StampSeconds: number | null
  within10sRate: number | null
  newCustomers: number
  returnedWithin14Days: number
  reportViews: number
  diagnosisViews: number
  manualGrants: number
  autoGrants: number
  sources: Record<string, number>
}

/** 이탈 위험 단골 */
export interface AtRiskCustomer {
  customerId: number
  phoneLast4: string
  name: string | null
  visitCount: number
  avgCycleDays: number
  daysSinceLast: number
  overdueRatio: number
  lastVisitAt: string
}

/** 마케팅 실행 기록 */
export interface MarketingAction {
  id: number
  actionType: string
  source: 'F3' | 'MANUAL'
  date: string
  memo: string | null
}

/** AI 언급률 (참고 지표 — 쉬마 지수에 포함 안 됨) */
export interface AiMention {
  checkedAt: string
  model: string
  asked: number
  mentioned: number
  items: { question: string; mentioned: boolean; answerExcerpt: string; webSearches: number; searchSuggestionsHtml?: string | null }[]
}
