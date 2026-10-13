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
  key: 'exposure' | 'reputation' | 'activity' | 'completeness' | 'revisit'
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
}
