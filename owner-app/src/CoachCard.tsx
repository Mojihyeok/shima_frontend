import { useEffect, useState } from 'react'
import { getCoach } from './api'
import type { Coach } from './types'
import { TASK_LABEL } from './coach'

/** 대시보드 요약 카드 — 이번 주 할 일 한 줄 + 자세히 보기 (#/coach) */
export default function CoachCard({ easy }: { easy: boolean }) {
  const [c, setC] = useState<Coach | null | undefined>(undefined)

  useEffect(() => { getCoach().then(setC).catch(() => setC(null)) }, [])
  if (c === undefined) return null

  const pending = c && c.status === 'PENDING'
  return (
    <section className="card coach-card">
      <h2 className="card-title">
        {easy ? '이번 주에 할 일' : 'AI 처방 · 이번 주 할 일'}
        {c && <span className="card-sub">{TASK_LABEL[c.taskType] ?? c.taskType}</span>}
      </h2>
      {pending ? (
        <>
          <p className="coach-title">{c.title}</p>
          {c.why && <p className="muted">{c.why}</p>}
          <a className="give-btn wide link-btn" href="#/coach">{easy ? '어떻게 하는지 보기' : '자세히 보기 · 문구 초안'}</a>
        </>
      ) : (
        <>
          <p className="muted">
            {c ? (c.status === 'DONE' ? `지난 할 일 "${c.title}"을 마쳤어요. 👍` : '지난 추천은 건너뛰었어요.') : '우리 가게 진단과 손님 기록을 보고 할 일을 하나 골라 드려요.'}
          </p>
          <a className="give-btn wide link-btn" href="#/coach">{c ? '새 할 일 받기' : '할 일 추천 받기'}</a>
        </>
      )}
    </section>
  )
}
