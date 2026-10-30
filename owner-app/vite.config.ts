import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 사장님 앱 (적응형 대시보드) — 개발 포트 5173
// host: true → 카운터 태블릿에서 PC IP로 접속 가능
// tailwindcss(): src/tailwind.css(유틸리티 전용)를 처리 — 화면 전환 애니메이션에만 씀
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: true },
})
