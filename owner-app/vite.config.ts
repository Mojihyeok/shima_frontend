import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 사장님 앱 (적응형 대시보드) — 개발 포트 5173
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
