import { useEffect, useState, type FormEvent } from 'react'
import { getDailyCount, setDailyCount } from './api'

/**
 * 오늘 전체 손님 수 입력 (영수증 건수) — 적립 참여율(QR 적립 ÷ 전체 손님)의 분모.
 * 대시보드 자동 갱신과 분리: 처음 한 번만 불러오고, 저장할 때만 서버에 보냄.
 */
export default function DailyCountCard({ easy }: { easy: boolean }) {
  const [saved, setSaved] = useState<number | null>(null)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    getDailyCount()
      .then((d) => { setSaved(d.count); if (d.count !== null) setValue(String(d.count)) })
      .catch(() => {})
  }, [])

  const n = Number(value)
  const valid = value.trim() !== '' && Number.isInteger(n) && n >= 0 && n <= 5000

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    setBusy(true); setMsg('')
    try {
      const d = await setDailyCount(n)
      setSaved(d.count)
      setMsg('저장했어요')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '저장하지 못했어요')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <h2 className="card-title">
        {easy ? '오늘 손님은 모두 몇 분이었나요?' : '오늘 전체 손님 수'}
        {saved !== null && <span className="count-badge">{saved}명</span>}
      </h2>
      <p className="muted">{easy ? '마감할 때 영수증 장수를 보고 적어 주세요.' : '영수증 건수 기준 — 적립 참여율 계산에 쓰여요.'}</p>
      <form className="daily-form" onSubmit={save}>
        <label className="sr-only" htmlFor="daily-count">오늘 전체 손님 수</label>
        <input
          id="daily-count"
          className="daily-input"
          type="number"
          inputMode="numeric"
          min={0}
          max={5000}
          value={value}
          onChange={(e) => { setValue(e.target.value); setMsg('') }}
          placeholder="예: 42"
        />
        <span className="daily-unit">명</span>
        <button className="give-btn" type="submit" disabled={!valid || busy}>{busy ? '저장 중…' : saved === null ? '저장' : '수정'}</button>
      </form>
      {msg && <p className="muted" role="status">{msg}</p>}
    </section>
  )
}
