import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getQr, getPrintQr, customerUrl } from './api'
import type { QrInfo } from './types'

/**
 * mode="live"  : 카운터 태블릿용. 30초마다 조회 → 서버가 토큰을 자동 교체(10분 유효, 5분마다 새 QR).
 * mode="print" : 인쇄용 장기 QR. 인쇄 버튼으로 A4 한 장 출력.
 */
export default function QrScreen({ mode }: { mode: 'live' | 'print' }) {
  const [qr, setQr] = useState<QrInfo | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = () =>
      (mode === 'live' ? getQr() : getPrintQr())
        .then((q) => { setQr(q); setError('') })
        .catch(() => setError('QR을 불러오지 못했어요. 서버를 확인해 주세요.'))
    load()
    if (mode === 'live') {
      const t = setInterval(load, 30_000)
      return () => clearInterval(t)
    }
  }, [mode])

  if (error) return <main className="qr-page"><p className="error">{error}</p></main>
  if (!qr) return <main className="qr-page"><p className="muted">불러오는 중…</p></main>

  const url = customerUrl(qr.token)

  return (
    <main className="qr-page">
      <a className="qr-back no-print" href="#/">← 대시보드</a>
      <p className="qr-store">{qr.storeName}</p>
      <h1 className="qr-title">휴대폰 카메라로 찍고<br />도장 받으세요</h1>
      <div className="qr-box">
        <QRCodeSVG value={url} size={320} level="M" marginSize={2} />
      </div>
      <p className="qr-sub">앱 설치·회원가입 없이 3초</p>
      {mode === 'live' ? (
        <p className="qr-note no-print">QR은 자동으로 바뀌어요 · 이 화면을 켜 두세요</p>
      ) : (
        <button className="print-btn no-print" onClick={() => window.print()}>인쇄하기</button>
      )}
      <p className="qr-url no-print">{url}</p>
    </main>
  )
}
