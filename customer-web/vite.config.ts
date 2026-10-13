import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 손님 웹 (무설치 QR 적립, 경량) — 개발 포트 5174
// host: true → 같은 와이파이의 폰에서 PC IP로 접속 가능
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, host: true },
})
