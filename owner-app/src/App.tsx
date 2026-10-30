import { useEffect, useState } from 'react'
import './App.css'
import QrScreen from './QrScreen'
import Login from './Login'
import Dashboard from './Dashboard'
import Report from './Report'
import Diagnosis from './Diagnosis'
import DesignSystem from './DesignSystem'
import OwnerFlow from './flow/OwnerFlow'
import { getToken } from './auth'
import { applyMode, cachedMode } from './mode'

// 첫 화면부터 마지막으로 쓴 모드의 글자 크기로 (깜빡임 방지)
applyMode(cachedMode())

/** 해시 라우팅 (라이브러리 없이) — #/ 대시보드, #/qr 태블릿 QR, #/qr-print 인쇄용, #/report 주간 리포트 */
function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || '#/')
  useEffect(() => {
    const on = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

export default function App() {
  const route = useHashRoute()
  const [authed, setAuthed] = useState(() => !!getToken())

  // 토큰 만료/로그아웃 신호 → 로그인 화면으로
  useEffect(() => {
    const onLogout = () => setAuthed(false)
    window.addEventListener('shima:logout', onLogout)
    return () => window.removeEventListener('shima:logout', onLogout)
  }, [])

  // 디자인 시스템 확인 페이지는 로그인 없이 (정적 시트)
  if (route === '#/design-system') return <DesignSystem />
  // 사장님 흐름 화면 (Figma 01, 목업 데이터) — #/flow/o1 ~ o7
  if (route.startsWith('#/flow')) return <OwnerFlow route={route} />
  if (!authed) return <Login onLoggedIn={() => setAuthed(true)} />
  if (route === '#/qr') return <QrScreen mode="live" />
  if (route === '#/qr-print') return <QrScreen mode="print" />
  if (route === '#/report') return <Report />
  if (route === '#/diagnosis') return <Diagnosis />
  return <Dashboard />
}
