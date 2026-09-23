import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 손님 웹 (무설치 QR 적립, 경량) — 개발 포트 5174
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
})
