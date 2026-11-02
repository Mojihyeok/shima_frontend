import { useState, type FormEvent } from 'react'
import { addAction, deleteAction } from './api'
import type { MarketingAction } from './types'
import { ACTION_TYPES, actionLabel, todayKst } from './actions'
import { md } from './dates'

/**
 * 마케팅 실행 기록 — 기록하면 방문 그래프에 ◆로 표시돼 "그 주에 손님이 어땠는지" 같이 볼 수 있음.
 * 쉬움: 오늘 한 일 버튼 한 번 / 표준: 종류·날짜·메모
 */
export default function MarketingCard({ easy, actions, onChange }: {
  easy: boolean
  actions: MarketingAction[]
  onChange: () => void
}) {
  const [type, setType] = useState(ACTION_TYPES[0].value)
  const [date, setDate] = useState(todayKst())
  const [memo, setMemo] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function record(t: string, d?: string, m?: string) {
    setBusy(true); setMsg('')
    try {
      await addAction(t, d, m)
      setMsg(`${actionLabel(t)} 기록했어요`)
      setMemo('')
      onChange()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '기록하지 못했어요')
    } finally {
      setBusy(false)
    }
  }

  async function remove(a: MarketingAction) {
    if (!window.confirm(`${md(a.date)} ${actionLabel(a.actionType)} 기록을 지울까요?`)) return
    try {
      await deleteAction(a.id)
      onChange()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '지우지 못했어요')
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    record(type, date, memo.trim())
  }

  const recent = [...actions].reverse().slice(0, easy ? 3 : 8) // 최신순

  return (
    <section className="card">
      <h2 className="card-title">{easy ? '오늘 한 홍보가 있나요?' : '마케팅 실행 기록'}</h2>
      <p className="muted">
        {easy ? '누르면 그래프에 표시돼서, 그 주에 손님이 어땠는지 같이 볼 수 있어요.'
              : '기록하면 방문 추이 그래프에 ◆로 표시돼요 (같은 시기 비교용).'}
      </p>

      {easy ? (
        <div className="action-grid">
          {ACTION_TYPES.map((t) => (
            <button key={t.value} className="action-btn" disabled={busy} onClick={() => record(t.value)}>{t.label}</button>
          ))}
        </div>
      ) : (
        <form className="action-form" onSubmit={submit}>
          <label className="sr-only" htmlFor="act-type">종류</label>
          <select id="act-type" value={type} onChange={(e) => setType(e.target.value)}>
            {ACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label className="sr-only" htmlFor="act-date">날짜</label>
          <input id="act-date" type="date" value={date} max={todayKst()} onChange={(e) => setDate(e.target.value)} />
          <label className="sr-only" htmlFor="act-memo">메모</label>
          <input id="act-memo" type="text" maxLength={100} placeholder="메모 (선택) 예: 신메뉴 사진" value={memo}
                 onChange={(e) => setMemo(e.target.value)} />
          <button className="give-btn" type="submit" disabled={busy || !date}>{busy ? '기록 중…' : '기록'}</button>
        </form>
      )}
      {msg && <p className="muted" role="status">{msg}</p>}

      {recent.length > 0 && (
        <ul className="list action-list">
          {recent.map((a) => (
            <li key={a.id} className="row">
              <div className="row-main">
                <span className="row-name">{actionLabel(a.actionType)}</span>
                <span className="row-sub">{md(a.date)}{a.memo ? ` · ${a.memo}` : ''}{a.source === 'F3' ? ' · AI 추천' : ''}</span>
              </div>
              <button className="del-btn" onClick={() => remove(a)} aria-label={`${md(a.date)} ${actionLabel(a.actionType)} 기록 지우기`}>지우기</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
