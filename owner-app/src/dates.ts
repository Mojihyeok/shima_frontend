/** 'YYYY-MM-DD' → 로컬 Date (UTC 파싱으로 하루 밀리는 문제 방지) */
export function parseDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const md = (s: string) => { const d = parseDay(s); return `${d.getMonth() + 1}/${d.getDate()}` }
export function addDays(s: string, n: number): string {
  const d = parseDay(s); d.setDate(d.getDate() + n)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
