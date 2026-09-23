# 쉬마 프론트엔드 (monorepo)

React + TypeScript + Vite. 두 개의 앱을 한 저장소에서 관리한다.

- `owner-app/` — 사장님 앱 (적응형 디자인 토큰 대시보드), 개발 포트 5173
- `customer-web/` — 손님 웹 (무설치 QR 적립, 경량 번들), 개발 포트 5174

## 실행
```
cd owner-app && npm install && npm run dev      # http://localhost:5173
cd customer-web && npm install && npm run dev   # http://localhost:5174
```

백엔드(shima-backend)는 http://localhost:8080 에서 실행. CORS는 5173/5174 허용됨.
