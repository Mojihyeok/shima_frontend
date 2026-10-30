import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './tailwind.css'
import App from './App.tsx'
import CustomerFlow from './flow/CustomerFlow.tsx'

// #/flow 로 열면 손님 흐름 화면 (Figma 02, 목업 데이터) — 기존 QR 적립(App)은 그대로
const isFlow = window.location.hash.startsWith('#/flow')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isFlow ? <CustomerFlow /> : <App />}
  </StrictMode>,
)
