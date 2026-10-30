import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 손님 웹 (무설치 QR 적립, 경량) — 개발 포트 5174
// host: true → 같은 와이파이의 폰에서 PC IP로 접속 가능
// tailwindcss(): src/tailwind.css(유틸리티 전용)를 처리 — 화면 전환 애니메이션에만 씀
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174, host: true },
})
