# Shoppr

상품 목록 쇼핑몰 UI — 웹 퍼블리셔에서 프론트엔드 개발자로 전향하며 만드는 포트폴리오 프로젝트입니다.

## 기술 스택
- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- 스타일: Tailwind CSS 3 → SCSS Module로 전환 중
- (예정) Storybook, TanStack Query, Vitest · Playwright

## 실행
```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 프로덕션 빌드
npm run lint    # ESLint
```

## 구조
```
src/
├─ app/          # 파일 기반 라우팅 (layout, page, products/[id], not-found)
├─ components/   # UI 컴포넌트
├─ lib/          # 순수 함수 (포맷, 필터, 정렬)
├─ data/         # 목 데이터
└─ types/        # 공통 타입
docs/steps/      # 스텝별 학습 기록
```

## 진행 기록
단계별로 무엇을, 왜 했는지는 [docs/steps](docs/steps/)에 정리되어 있습니다.
