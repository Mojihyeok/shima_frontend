// 백엔드 응답 타입 (shima-backend와 1:1)
export interface LandingResponse {
  storeName: string
  stampGoal: number
  rewardName: string | null
}

export interface StampResponse {
  storeName: string
  stamps: number
  stampGoal: number
  remaining: number
  rewardReached: boolean
  rewardName: string | null
  alreadyStampedToday: boolean
}

export interface ApiError {
  error: string
  message: string
}
