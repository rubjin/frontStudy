# Step 3. 실무 환경 전환 — Next.js · TypeScript · SCSS Module · Storybook

> 상태: 진행 중 (3-1, 3-2 완료)

## 목표
지금까지는 Vite + JavaScript + Tailwind로 "React가 어떻게 동작하는지"를 익혔다.
실무 프론트엔드 채용 공고에서 가장 많이 보이는 조합은 **Next.js + TypeScript**이고, 퍼블리셔 출신의 강점은 **CSS 설계(SCSS)와 컴포넌트 문서화(Storybook)** 로 보여 줄 수 있다.
Step 3에서는 **화면은 그대로 두고, 그 아래의 개발 환경을 실무형으로 바꾼다.**

## 세부 단계
- [x] **3-1** Vite → Next.js(App Router) + TypeScript
- [x] **3-2** Tailwind → SCSS Module (디자인 토큰, mixin, CSS 변수 다크 모드, 한글 웹폰트)
- [ ] **3-3** Storybook (컴포넌트 스토리, 자동 문서, 접근성 검사)
- [ ] **3-4** 코드 품질 도구 (Prettier, Stylelint, husky + lint-staged)

> 한 번에 다 바꾸지 않고, **각 단계가 끝날 때마다 화면이 정상 동작하는 상태**를 유지한다.
> 그래서 3-1에서는 스타일(Tailwind)을 건드리지 않고 프레임워크와 언어만 바꿨다.

---

## 3-1. Vite → Next.js + TypeScript

### 왜 바꾸나?
| | Vite + React (이전) | Next.js (지금) |
| --- | --- | --- |
| 화면을 그리는 곳 | 브라우저에서만 (빈 `index.html` → JS가 전부 그림) | **서버에서 HTML을 미리 그려서** 보냄 |
| 첫 화면 / 검색엔진 | JS가 실행돼야 내용이 보임 | HTML에 내용이 이미 있음 → 빠르고 SEO 유리 |
| 라우팅 | react-router 설치 후 `<Route>` 직접 작성 | **폴더 구조 = 주소** (파일 기반) |
| 404 | 없는 주소도 200 OK 응답 | 진짜 404 상태 코드 응답 |
| 백엔드 | 별도 서버 필요 | `app/api`에 API도 만들 수 있음 (Step 6) |

TypeScript는 원래 Step 9 계획이었지만, 어차피 모든 파일을 옮겨야 하므로 **지금 같이 바꾸는 게 비용이 가장 적다.**

### 설치 · 제거한 것
```bash
# 제거: Vite, react-router, Vite용 ESLint 플러그인
npm uninstall vite @vitejs/plugin-react react-router eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh globals @eslint/js
# 추가: Next.js + React 19
npm install next@16 react@19 react-dom@19
# 추가: TypeScript와 타입 정의, Next.js용 ESLint 설정
npm install -D typescript @types/node @types/react@19 @types/react-dom@19 eslint-config-next@16
```
> 예전에 react-router v8이 React 19를 요구해서 v7을 썼는데, 이제 React 19로 올렸으므로 그 제약도 사라졌다. (react-router 자체도 더 이상 쓰지 않음)

### 바뀐 구조
```
[이전: Vite]                              [지금: Next.js]
index.html                                (없음 — layout.tsx가 <html>을 그림)
src/main.jsx  (BrowserRouter)             (없음 — Next.js가 알아서 처리)
src/App.jsx   (다크 모드 + Routes)   →    src/app/layout.tsx        공통 틀 (서버 컴포넌트)
                                          src/components/Header.tsx  다크 모드 상태 ('use client')
src/pages/ProductListPage.jsx        →    src/app/page.tsx           "/" (서버 컴포넌트)
                                          src/components/ProductCatalog.tsx  목록 상태 ('use client')
src/pages/ProductDetailPage.jsx      →    src/app/products/[id]/page.tsx     "/products/3"
src/pages/NotFoundPage.jsx           →    src/app/not-found.tsx              404
src/index.css                        →    src/app/globals.css
*.js / *.jsx                         →    *.ts / *.tsx
(없음)                               →    src/types/product.ts       Product 타입
```

### 파일별 설명
| 파일 | 역할 |
| --- | --- |
| `package.json` | 스크립트를 `next dev / build / start`로 변경. `"type": "module"` 제거 |
| `tsconfig.json` (새 파일) | TypeScript 설정. `strict: true`(엄격 모드), `@/*` → `src/*` 경로 별칭 |
| `next.config.ts` (새 파일) | Next.js 설정. 지금은 비어 있음 |
| `eslint.config.mjs` | Next.js 권장 규칙(`core-web-vitals`) + TypeScript 규칙으로 교체 |
| `tailwind.config.ts`, `postcss.config.mjs` | 확장자만 변경, `content` 경로 수정. **3-2에서 삭제 예정** |
| `.gitignore` | `.next`(빌드 결과), `next-env.d.ts`, `*.tsbuildinfo` 추가 |
| `src/lib/site.ts` (새 파일) | 사이트 이름(`SITE_NAME`)과 제목 형식(`formatTitle`). layout의 template과 에러 페이지 `<title>`이 함께 사용 |
| `src/types/product.ts` (새 파일) | 상품 데이터 모양(`Product` 인터페이스) |
| `src/app/layout.tsx` | `<html lang="ko">`, `<body>`, Header, `<main>`. `metadata`로 제목 틀(`title.template`)·설명·Open Graph 설정 |
| `src/app/page.tsx` (새 파일) | "/" 페이지. 스크린리더용 `h1` + `ProductCatalog` |
| `src/components/ProductCatalog.tsx` | 예전 목록 페이지. `'use client'` + 상태 타입(`useState<SortValue>`) |
| `src/components/Header.tsx` | 다크 모드 상태를 직접 가짐. `<html>`에 `dark` 클래스를 붙임 |
| `src/app/products/[id]/page.tsx` | `params`를 `await`로 꺼내는 async 서버 컴포넌트. `generateMetadata`로 id별 제목 |
| `src/app/not-found.tsx` | 약속된 파일 이름이라 자동으로 404에 쓰임. 화면은 `StatusView`에 맡기고 문구·버튼만 정함 |
| `src/components/StatusView.tsx` (새 파일) | 404·에러 화면의 공통 모양(코드 · 제목 · 설명 · 버튼 자리) |
| `src/components/BackButton.tsx` (새 파일) | '이전 페이지로' 버튼. `router.back()`, 돌아갈 기록이 없으면 홈으로. 404 화면에서 사용 |
| `src/components/ui/Button.tsx` (새 파일) | 공통 버튼. `Button`(`<button>`, 동작) / `ButtonLink`(`<a>`, 이동). `variant`·`size`로 모양 선택 |
| `src/app/error.tsx` (새 파일) | 페이지를 그리다 에러가 나면 그 자리만 바꿔 끼우는 화면. 다시 시도 / 홈으로 |
| `src/app/global-error.tsx` (새 파일) | 레이아웃 자체가 망가졌을 때 쓰는 최후의 화면. `<html>`부터 직접 그림 |
| `src/components/*.tsx`, `src/lib/*.ts` | props·함수에 타입 추가, `react-router`의 `Link to` → `next/link`의 `Link href` |

### 핵심 개념

**1. 파일 기반 라우팅 (App Router)**
```
src/app/page.tsx                 → /
src/app/products/[id]/page.tsx   → /products/1, /products/2 ...
src/app/not-found.tsx            → 없는 주소
src/app/layout.tsx               → 위 모든 페이지를 감싸는 공통 틀
```
`page.tsx`, `layout.tsx`, `not-found.tsx`처럼 **정해진 파일 이름**이 역할을 결정한다.
`[id]`처럼 대괄호로 감싼 폴더는 react-router의 `:id`와 같다.

**2. 서버 컴포넌트 vs 클라이언트 컴포넌트** ← Next.js에서 가장 중요한 개념
| | 서버 컴포넌트 (기본값) | 클라이언트 컴포넌트 (`'use client'`) |
| --- | --- | --- |
| 실행 위치 | 서버 | 서버(첫 HTML) + 브라우저 |
| `useState`, `useEffect`, `onClick` | ❌ | ✅ |
| `async`/`await`로 데이터 가져오기 | ✅ | ❌ (Step 7에서 TanStack Query로) |
| 브라우저로 보내는 JS | 없음 | 있음 |

그래서 이 프로젝트는 이렇게 나눴다.
```
layout.tsx (서버)
 ├─ Header ('use client')         ← 다크 모드 버튼 = 상호작용 필요
 └─ page.tsx (서버)
     └─ ProductCatalog ('use client')  ← 검색·필터 상태 필요
         └─ SearchBar, Card ...       ← 클라이언트 컴포넌트 안에서 import되면 자동으로 클라이언트
```
원칙: **`'use client'`는 필요한 곳에만, 최대한 아래쪽(잎사귀)에 작게 둔다.**

**3. 다크 모드 상태가 Header로 이동한 이유**
예전 `App.jsx`는 다크 모드 state를 갖고 `<div className="dark">`로 감쌌다.
`layout.tsx`는 서버 컴포넌트라 state를 못 가지므로, 버튼이 있는 Header가 state를 갖고 `useEffect`로 `<html>`에 클래스를 붙인다.
```tsx
useEffect(() => {
  document.documentElement.classList.toggle('dark', dark)
}, [dark])
```
`useEffect`는 **React 바깥의 것(DOM, localStorage, 타이머 등)을 건드릴 때** 쓴다.

**4. TypeScript 기초 — 이번에 쓴 문법**
```ts
// 객체 모양 정의
interface Product { id: number; name: string; price: number }

// props 타입
interface CardProps { product: Product }
function Card({ product }: CardProps) { ... }

// 함수 타입: 문자열을 받고 아무것도 돌려주지 않는 함수
onChange: (value: string) => void

// 유니온 타입: 이 중 하나만 허용
type SortValue = 'default' | 'price-asc' | 'price-desc' | 'rating'

// 선택 필드
hideSoldOut?: boolean

// 제네릭: useState에 들어갈 값의 타입 지정
useState<SortValue>('default')

// 타입 단언: "내가 확실히 아니까 이 타입으로 봐 줘" (남용 금지)
e.target.value as SortValue
```
퍼블리셔 관점으로 비유하면, TypeScript는 **HTML 유효성 검사기(validator)를 JS에 붙인 것**이다. 잘못된 속성·값을 실행 전에 잡아 준다.

**5. 동적 라우트의 `params`는 Promise**
```tsx
export default async function ProductDetailPage({ params }: PageProps<'/products/[id]'>) {
  const { id } = await params // '3' (여전히 문자열!)
}
```
Next.js 15부터 `params`, `searchParams`는 Promise라서 `await`가 필요하다. `PageProps<'/products/[id]'>`는 Next.js가 폴더 구조를 보고 만들어 주는 타입이다.

**6. 경로 별칭 `@/`**
```ts
import { formatPrice } from '../../lib/format' // 이전: 폴더 깊이마다 ../ 개수가 달라짐
import { formatPrice } from '@/lib/format'     // 지금: 어디서든 같은 모양
```

**7. 에러 화면 공통화 — 모양은 하나, 내용만 다르게**
404, 서버 에러, (Step 4의) 없는 상품 화면은 **모양이 같고 문구·버튼만 다르다.** 파일마다 마크업을 복사하면 디자인을 바꿀 때 전부 고쳐야 하므로, 모양은 `StatusView` 하나에 두고 각 파일은 내용만 넘긴다.
```tsx
// not-found.tsx
<StatusView code="404" title="페이지를 찾을 수 없습니다" description="...">
  <Link href="/">홈으로 가기</Link>        {/* children = 버튼 자리 */}
</StatusView>

// error.tsx
<StatusView code="500" title="문제가 발생했습니다" description="...">
  <button onClick={() => retry()}>다시 시도</button>
  <Link href="/">홈으로 가기</Link>
</StatusView>
```
**문구는 StatusView가 아니라 각 페이지에 둔다**
- StatusView가 404·500 문구까지 가지면(프리셋 방식) 새 상황(없는 상품, 로그인 필요…)이 생길 때마다 공통 부품을 고쳐야 한다. 공통 틀은 **내용을 모를수록 재사용하기 쉽다.**
- 같은 문구를 여러 곳에서 쓰게 되면 그때 StatusView 안이 아니라 **별도 파일**(`constants/messages.ts`, 다국어라면 `messages/ko.json`)로 모은다.
- 대신 **같은 파일 안의 중복은 상수로** 없앤다. 탭 제목(metadata)과 화면 제목에 같은 문구를 쓰므로 `const TITLE = '...'`로 한 번만 적는다.
- 사이트 이름과 `제목 | Shoppr` 형식은 layout·에러 페이지 여러 곳에서 쓰므로 `lib/site.ts`(`SITE_NAME`, `formatTitle`)로 모았다.
  ```ts
  // layout.tsx
  title: { template: formatTitle('%s'), default: `${SITE_NAME} — 상품 목록 쇼핑몰` }
  // error.tsx ('use client'라 template이 적용되지 않음)
  <title>{formatTitle(TITLE)}</title>
  ```
  **기준: 한 파일에서만 쓰면 그 파일 안에 상수로, 여러 파일에서 쓰면 공통 파일로.**

버튼을 props가 아닌 **children**으로 받는 이유: 화면마다 버튼 개수와 종류(링크/버튼)가 달라서, 모양 컴포넌트가 그것까지 알 필요가 없게 하려는 것이다. (컴포지션 패턴)

Next.js의 에러 관련 파일 규칙
| 파일 | 언제 보이나 | 레이아웃(헤더) | 서버/클라이언트 |
| --- | --- | --- | --- |
| `not-found.tsx` | 없는 주소, 또는 코드에서 `notFound()` 호출 | 유지 | 서버 가능 |
| `error.tsx` | 페이지를 그리다 에러 | 유지 (그 자리만 교체) | **반드시 `'use client'`** |
| `global-error.tsx` | `layout.tsx` 자체의 에러 | **없음** (`<html>`부터 직접 그림) | **반드시 `'use client'`** |

- 폴더 안에 두면 그 폴더 범위에만 적용된다. 예) `app/products/[id]/not-found.tsx`를 만들면 상품 상세에서만 "상품을 찾을 수 없습니다"가 나온다. (Step 4)
- `error.tsx`가 `'use client'`인 이유: React의 에러 경계는 브라우저에서 동작하고, '다시 시도' 버튼에 onClick이 필요하기 때문이다.
- `retry()`: 에러 난 부분을 다시 불러와서 그려 본다. 일시적인 네트워크 문제라면 복구된다. (예전 문서·블로그에는 `reset`으로 나오지만 Next.js 16에서는 `retry`를 권장)
- 운영 환경에서 서버 에러의 `error.message`는 보안상 일반 문구로 바뀐다. 에러 원인을 화면에 그대로 보여 주지 않는다.

**8. 페이지별 metadata — 제목 틀은 레이아웃에, 제목은 페이지에**
```tsx
// layout.tsx — 사이트 전체 기본값
export const metadata: Metadata = {
  title: { template: '%s | Shoppr', default: 'Shoppr — 상품 목록 쇼핑몰' },
  description: '...',
  openGraph: { siteName: 'Shoppr', locale: 'ko_KR', type: 'website' },
}

// not-found.tsx — 제목이 고정이면 객체로
export const metadata: Metadata = { title: '페이지를 찾을 수 없습니다' }

// products/[id]/page.tsx — 주소에 따라 달라지면 함수로
export async function generateMetadata({ params }): Promise<Metadata> {
  const { id } = await params
  return { title: `상품 #${id}` }
}
```
| 주소 | 결과 `<title>` | 어디서 정했나 |
| --- | --- | --- |
| `/` | Shoppr — 상품 목록 쇼핑몰 | 레이아웃 `default` (홈은 title을 안 적음) |
| `/products/3` | 상품 #3 | Shoppr | `generateMetadata` + `template` |
| `/abc` | 페이지를 찾을 수 없습니다 | Shoppr | `not-found.tsx`의 metadata + `template` |
| 에러 발생 | 문제가 발생했습니다 | Shoppr | `error.tsx` 안의 `<title>` 태그 |

- **왜 페이지마다 제목을 다르게?** 브라우저 탭·북마크에서 구분되고, 스크린리더는 페이지를 옮길 때 `<title>`을 먼저 읽는다(WCAG 2.4.2). 검색 결과에 보이는 제목도 이것이다.
- **덮어쓰기 규칙**: 페이지의 metadata는 레이아웃 값 위에 덮어쓰고, 적지 않은 항목(description, openGraph 등)은 레이아웃 값을 물려받는다.
- **`error.tsx`는 예외**: `'use client'` 파일은 metadata를 내보낼 수 없다. React 19부터는 컴포넌트 안에 `<title>`을 쓰면 React가 `<head>`로 옮겨 주므로 이 방법을 쓴다. template이 적용되지 않아 `| Shoppr`까지 직접 적는다.
- **404와 검색엔진**: 404 응답에는 Next.js가 `<meta name="robots" content="noindex">`를 자동으로 넣는다. 따로 설정할 필요가 없다.
- **미리보기 이미지(og:image)** 는 절대 주소가 필요해서 배포 주소가 생기는 Step 11에서 `metadataBase`와 함께 추가한다.

**9. 공통 버튼 컴포넌트 — 모양은 공유, 태그는 역할대로**
```tsx
<Button onClick={() => retry()}>다시 시도</Button>                  // → <button type="button">
<ButtonLink href="/" variant="secondary">홈으로 가기</ButtonLink>   // → <a href="/">
<Button variant="ghost" size="icon" aria-label="Toggle dark mode">  // 아이콘 버튼
```
- **왜 두 개로 나누나?** 모양이 같아도 **페이지 이동은 `<a>`, 화면 안 동작은 `<button>`** 이어야 한다.
  `<button onClick={() => router.push('/')}>`로 이동을 흉내 내면 새 탭 열기·링크 복사가 안 되고, 스크린리더도 '버튼'으로 잘못 읽는다.
- **variant = 역할(중요도)**: `primary`(화면에서 가장 중요한 행동 하나), `secondary`(보조), `ghost`(배경 없음, 아이콘·툴바). 퍼블리셔의 `.btn-primary`, `.btn-sm` 가이드를 props로 옮긴 것이다.
- **`ComponentProps<'button'>`**: `<button>`이 받는 모든 속성(`onClick`, `disabled`, `aria-*`…)의 타입. 여기에 `variant`·`size`를 더해서, 일반 button처럼 쓰면서 모양만 고를 수 있다.
- **`...rest`로 나머지 props 전달**: `variant`·`size`·`className`만 꺼내고 나머지는 `{...rest}`로 태그에 그대로 넘긴다. 공통 컴포넌트를 만들 때 가장 흔한 패턴이다.
- **`type="button"` 기본값**: `<button>`의 원래 기본값은 `submit`이라 form 안에서 실수로 제출된다. 공통 컴포넌트에서 한 번 막아 두면 모든 곳이 안전해진다.
- **`components/ui/`**: 기능과 상관없는 기본 부품(버튼 등)을 모아 두는 곳. 쇼핑몰 전용 부품(Card, CategoryFilter…)과 구분한다.
- **아직 Button을 쓰지 않은 곳**: 카테고리 버튼은 선택/해제되는 토글(칩)이라 역할이 달라서 그대로 두었다. 카드 링크(늘린 링크), 로고, "← 목록으로" 텍스트 링크도 버튼 모양이 아니라서 제외.
- 3-2에서 `Button.module.scss`로, 3-3에서 **Storybook 첫 스토리**로 만든다.

**10. '이전 페이지로'는 링크가 아니라 버튼 — `BackButton`**
```tsx
const router = useRouter() // next/navigation (App Router용. next/router 아님)

function handleClick() {
  if (window.history.length > 1) router.back() // 방문 기록에서 한 칸 뒤로
  else router.push('/')                        // 돌아갈 기록이 없으면 홈으로
}
```
- **왜 버튼?** 링크는 '정해진 주소'로 가는 것인데, 이전 페이지는 사용자마다 달라서 `href`로 정할 수 없다. 브라우저 뒤로 가기와 같은 **동작**이다.
- **돌아갈 기록이 없는 경우**: 주소를 직접 입력했거나 새 탭에서 처음 열었으면 `history.length`가 1이다. 이때 `back()`은 아무 일도 안 하므로 홈으로 보낸다. (다른 사이트에서 링크로 들어온 경우까지 구분하지는 못한다)
- **서버 컴포넌트 안의 클라이언트 컴포넌트**: `not-found.tsx`는 서버 컴포넌트(metadata를 내보내야 함)로 두고, 클릭이 필요한 버튼만 `'use client'`로 뺐다. 서버 → 클라이언트 방향으로 넣는 것은 자유롭다.
- **버튼 배치**: `[← 이전 페이지로(secondary)] [홈으로 가기(primary)]`. 가장 중요한 행동 하나만 primary.
- **Button이 있는데 왜 BackButton을 따로?** 새 버튼이 아니라 **Button을 감싸서 동작만 더한** 컴포넌트다.
  | 층 | 컴포넌트 | 맡는 일 |
  | --- | --- | --- |
  | 기본 부품 | `ui/Button` | 모양만 (무슨 동작인지 모름) |
  | 동작 부품 | `BackButton` | Button + 정해진 동작 (뒤로 가기, 기록 없으면 홈) |
  | 페이지 | `not-found.tsx` | 부품 배치 |

  `not-found.tsx`에서 `<Button onClick={() => router.back()}>`로 직접 쓸 수 없는 이유:
  ① 훅(`useRouter`)은 서버 컴포넌트에서 못 쓴다.
  ② 서버 컴포넌트는 클라이언트 컴포넌트에 **함수를 props로 넘길 수 없다.** 서버의 props는 텍스트(JSON)로 전송되는데 함수는 텍스트로 바꿀 수 없다. (문자열·숫자·배열은 가능)
  ③ 파일 전체를 `'use client'`로 만들면 metadata를 못 내보낸다.
- **props 타입은 복사하지 말고 물려받는다**
  ```ts
  type BackButtonProps = Omit<ComponentProps<typeof Button>, 'onClick'> & { fallbackHref?: string }
  ```
  - `ComponentProps<typeof Button>`: Button의 props 타입을 그대로 가져온다. Button에 variant가 늘어나면 BackButton도 자동으로 따라간다.
  - `Omit<..., 'onClick'>`: 그중 `onClick`만 뺀다. 클릭 동작은 BackButton이 정하므로 밖에서 덮어쓰지 못하게 막는다. (`<BackButton onClick={...}>`는 타입 에러)
  - 처음에는 `variant?: 'primary' | 'secondary' | 'ghost'`를 직접 적었는데, 그러면 Button과 목록이 따로 놀고 `size`·`disabled`도 못 넘겨서 이렇게 고쳤다.

### 확인 방법
1. `npm run dev` 후 http://localhost:3000 에서 목록 · 검색 · 카테고리 · 정렬 · 품절 숨기기가 전과 똑같이 동작하는지
2. 카드를 누르면 `/products/번호`로 이동하는지, 로고를 누르면 목록으로 오는지
3. `/abc`로 들어가면 404 화면이 나오는지. 개발자 도구 Network 탭에서 **상태 코드가 404**인지 (Vite 때는 200이었다)
4. 다크 모드 버튼이 동작하는지. 개발자 도구 Elements에서 `<html class="dark">`가 붙는지
5. **페이지 소스 보기(Ctrl+U)** 에서 상품 이름이 HTML에 들어 있는지 — 서버 렌더링의 증거. (Vite 때는 `<div id="root"></div>`뿐이었다)
6. `src/data/products.ts`에서 아무 상품의 `price`를 `'abc'`로 바꿔 보기 → 에디터에 빨간 줄이 생기고 `npx tsc --noEmit`이 에러를 내는지 (확인 후 되돌리기)
7. `npm run build`, `npm run lint`가 에러 없이 끝나는지
8. 404 화면의 '이전 페이지로': 목록에서 `/abc`로 이동한 뒤 누르면 목록으로 돌아오는지 / 새 탭에 `/abc`를 바로 열고 누르면 홈으로 가는지
9. 브라우저 탭 제목이 위 표처럼 페이지마다 다르게 바뀌는지. 페이지 소스 보기에서 `/abc`에만 `noindex`가 있는지
10. 에러 화면 확인: `src/app/boom/page.tsx`를 아래처럼 임시로 만들고 `/boom`에 접속 → **헤더는 남고** 본문만 "문제가 발생했습니다"로 바뀌는지. 확인 후 폴더째 삭제
   ```tsx
   export default function Boom(): never {
     throw new Error('test')
   }
   ```
   > 개발 모드(`npm run dev`)에서는 Next.js 에러 안내창이 먼저 뜬다. 닫으면 뒤에 우리가 만든 화면이 보인다.

### 알려진 한계 (다음 단계에서 해결)
- ~~새로고침하면 다크 모드가 풀린다~~ → 3-2에서 해결
- 상세 페이지 갔다가 돌아오면 필터가 초기화된다 → Step 4 (URL 쿼리)

---

## 3-2. Tailwind → SCSS Module

### 왜 바꾸나?
Tailwind는 빠르지만 "CSS를 설계하는 능력"은 잘 드러나지 않는다. 퍼블리셔 출신의 강점은 **디자인 토큰 · 재사용 규칙 · 테마 구조를 직접 설계**하는 데 있다.
실무에서도 SCSS Module(또는 CSS Module)은 Next.js 프로젝트에서 여전히 많이 쓰이는 조합이다.

| | Tailwind (이전) | SCSS Module (지금) |
| --- | --- | --- |
| 스타일 위치 | JSX의 긴 `className` 문자열 | 컴포넌트 옆 `.module.scss` 파일 |
| 클래스 충돌 | 유틸리티라 충돌 없음 | 빌드 때 `Card-module-scss-module__VIcUQW__name`처럼 고유한 이름으로 바뀌어 충돌 없음 |
| 다크 모드 | 모든 요소에 `dark:` 클래스 추가 | **CSS 변수 값만 바꾸면** 모든 컴포넌트가 따라 바뀜 |
| 디자인 값 | `tailwind.config`의 테마 | `_tokens.scss` (직접 설계) |

> 3-2는 원래 두 단계(3-2a 기반 → 3-2b 컴포넌트)로 나눠 커밋하려 했지만, 중간 상태에서는 Tailwind와 새 리셋 CSS가 섞여 오히려 헷갈려서 **커밋은 한 번**으로 했다. 따라 할 때는 아래 순서대로 하면 된다.

### 설치 · 제거한 것
```bash
npm install clsx                       # 클래스 이름 조합 도구
npm install -D sass pretendard         # SCSS 컴파일러, 한글 웹폰트
npm uninstall tailwindcss postcss autoprefixer
# tailwind.config.ts, postcss.config.mjs 삭제
```
> autoprefixer를 지워도 되는 이유: Next.js 16의 Turbopack은 Lightning CSS로 CSS를 처리하면서 필요한 브라우저 접두어(`-webkit-` 등)를 자동으로 붙인다.

### 3-2a. 기반 만들기 — 토큰 · mixin · 테마 · 전역 스타일
```
src/styles/
├─ _tokens.scss    값에 이름 붙이기: 색상표, space(), 글자 크기, 둥글기, 그림자, 브레이크포인트
├─ _mixins.scss    자주 쓰는 묶음: mq(), text(), focus-ring, sr-only, container, flex-center
├─ _index.scss     위 두 파일을 묶어 내보내는 입구 (@forward)
├─ _themes.scss    라이트/다크 CSS 변수 (--color-bg, --color-text ...)
└─ globals.scss    리셋 + html/body 기본값 + .sr-only (layout에서 한 번만 import)
```

컴포넌트의 `.module.scss`는 맨 위 한 줄로 토큰과 mixin을 모두 쓴다.
```scss
@use 'styles' as *;

.card {
  padding: space(6);                     // 1.5rem (4px 단위 간격 함수)
  border-radius: $radius-xl;             // 토큰
  background-color: var(--color-surface); // 테마 변수 (다크 모드에서 자동으로 바뀜)
  @include text(sm);                     // 글자 크기 + 줄 높이
  &:focus-visible { @include focus-ring; }
  @include mq(sm) { ... }                // 640px 이상
}
```
`'styles'`만 적어도 찾아지는 이유는 `next.config.ts`의 `sassOptions.loadPaths`에 `src`를 등록했기 때문이다.
> TypeScript처럼 `@use '@/styles'`를 쓰면 처음 파일은 찾지만, 그 파일 안의 `@forward 'tokens'`를 못 찾는 에러가 났다. 그래서 loadPaths 방식을 쓴다.

### 3-2b. 컴포넌트 전환
컴포넌트마다 같은 이름의 `.module.scss`를 만들고 `className="..."`을 `className={styles.xxx}`로 바꿨다.
```tsx
import styles from './Card.module.scss'

<article className={styles.card}>
  <h3 className={styles.name}>...</h3>
```
여러 클래스를 조건에 따라 합칠 때는 `clsx`를 쓴다. (Button)
```tsx
clsx(styles.button, styles[variant], styles[size], className)
// → 'Button-module-scss-module__OoW-YW__button ...__primary ...__md'
```

### 파일별 설명
| 파일 | 역할 |
| --- | --- |
| `next.config.ts` | `sassOptions.loadPaths: ['src']` — `@use 'styles'`로 어디서든 불러오기 |
| `src/styles/_tokens.scss` (새 파일) | 디자인 토큰. 색상 팔레트(원재료), `space()`, `$font-sizes`, `$radius-*`, `$shadow-*`, `$breakpoints` |
| `src/styles/_mixins.scss` (새 파일) | `mq()`, `text()`, `focus-ring`, `sr-only`, `container`, `flex-center` |
| `src/styles/_index.scss` (새 파일) | 토큰 + mixin을 묶어 내보내는 입구 |
| `src/styles/_themes.scss` (새 파일) | `:root`(라이트)와 `[data-theme='dark']`의 CSS 변수 |
| `src/styles/globals.scss` (← `app/globals.css`) | 리셋, html/body, 폰트 스택, `.sr-only` |
| `src/lib/theme.ts` (새 파일) | `applyTheme`, `getCurrentTheme`, 깜빡임 방지 스크립트 `themeInitScript` |
| `src/components/ThemeToggle.tsx` (새 파일) | 다크 모드 버튼 (`'use client'`). 아이콘·버튼 이름을 CSS로 전환 |
| `src/components/Header.tsx` | **다시 서버 컴포넌트**. 다크 모드 state 제거, ThemeToggle 사용 |
| `src/app/layout.tsx` | Pretendard, `globals.scss`, `<head>`에 테마 스크립트, `layout.module.scss` |
| `src/app/global-error.tsx` | `globals.scss`와 `layout.module.scss`를 직접 import |
| `src/components/*.module.scss` (새 파일 11개) | Button, Header, ThemeToggle, Card, CardGrid, CategoryFilter, SearchBar, SoldOutToggle, SortSelect, ProductCatalog, StatusView |
| `src/app/layout.module.scss`, `src/app/products/[id]/page.module.scss` (새 파일) | 페이지 전용 스타일은 page.tsx 옆에 둔다 |
| `src/components/SearchBar.tsx` | `aria-label="상품 검색"` 추가 (placeholder만 있고 이름이 없던 접근성 문제) |
| `src/components/CategoryFilter.tsx` | 선택 모양을 클래스 대신 `[aria-pressed='true']` 선택자로 |

### 핵심 개념

**1. CSS Module — 클래스 이름 충돌을 도구가 막아 준다**
```scss
// Card.module.scss
.title { ... }
```
```html
<!-- 실제 결과 (개발 모드 기준, 배포 빌드에서는 모양이 달라질 수 있음) -->
<h3 class="Card-module-scss-module__VIcUQW__title">
```
파일마다 클래스 이름이 고유하게 바뀌므로 `.title`을 여러 파일에서 써도 충돌하지 않는다. BEM(`.card__title--active`) 같은 긴 이름 규칙이 필요 없다.
전역(이름을 바꾸면 안 되는) 선택자는 `:global(...)`로 감싼다. 예) `:global([data-theme='dark']) .showInDark`

**2. 디자인 토큰 — 원재료와 역할 이름을 나눈다**
```
_tokens.scss   $gray: (50: #f9fafb, ..., 900: #111827)     ← 원재료 (컴포넌트에서 직접 쓰지 않음)
_themes.scss   --color-text: #{palette($gray, 900)}         ← 역할 이름 (컴포넌트는 이것만 씀)
Card.module    color: var(--color-text)
```
컴포넌트가 "회색 900"이 아니라 "기본 글자색"을 쓰기 때문에, 다크 모드에서는 `_themes.scss`의 **값만** 바꾸면 된다.
Tailwind 때는 요소마다 `text-gray-900 dark:text-gray-100`을 붙였지만, 이제 컴포넌트 SCSS에는 다크 모드 코드가 한 줄도 없다.

**3. SCSS 변수 vs CSS 변수**
| | SCSS 변수 `$radius-xl` | CSS 변수 `--color-bg` |
| --- | --- | --- |
| 언제 값이 정해지나 | 빌드할 때 (결과 CSS에는 값만 남음) | 브라우저에서 실행 중 |
| 실행 중 변경 | 불가 | 가능 (`data-theme`만 바꾸면 됨) |
| 용도 | 고정값: 간격, 둥글기, 브레이크포인트 | 바뀌는 값: 테마 색상 |

CSS 변수 안에 SCSS 값을 넣을 때는 `#{...}`(보간)로 감싼다. `--color-text: #{palette($gray, 900)};`

**4. `@use` / `@forward` (옛날 `@import` 대신)**
- `@import`는 변수를 전역에 풀어 놓아 이름이 겹치면 조용히 덮어쓰고, Sass에서 폐지 예정이다.
- `@use 'styles' as *`: 파일마다 필요한 것만 불러온다. 여러 번 불러와도 CSS가 중복 출력되지 않는다.
- `@forward`: 여러 파일을 하나의 입구(`_index.scss`)로 묶어 내보낸다.
- 전역 함수 `nth()` 대신 `list.nth()`(`@use 'sass:list'`)를 쓴다. 최신 Sass에서 전역 함수는 폐지 예정이다.

**5. mixin과 함수 — 반복을 이름 하나로**
```scss
@function space($n) { @return $n * 0.25rem; }   // 값을 계산해서 돌려준다
@mixin mq($bp) { @media (min-width: map.get($breakpoints, $bp)) { @content; } }  // CSS 묶음을 끼워 넣는다
```
- 함수는 **값 하나**를, mixin은 **CSS 여러 줄**을 만든다.
- `@content`: `@include mq(sm) { 여기 }`의 내용이 들어갈 자리.
- 모바일 우선(min-width): 작은 화면 스타일을 기본으로 쓰고, 큰 화면에서 덧붙인다.

**6. 다크 모드 — `data-theme` + localStorage + 깜빡임 방지**
```
[처음 방문]  localStorage 없음 → 운영체제 설정(prefers-color-scheme) → <html data-theme="dark">
[버튼 클릭]  data-theme 뒤집기 + localStorage에 저장
[새로고침]   <head>의 작은 스크립트가 화면을 그리기 '전에' 저장값을 읽어 data-theme을 붙임
```
- **깜빡임(FOUC)**: 서버는 사용자의 localStorage를 모르니 HTML은 항상 라이트로 온다. React가 뜬 뒤에 다크를 입히면 잠깐 흰 화면이 번쩍인다. 그래서 `<head>`에 React보다 먼저 실행되는 스크립트를 넣었다(`lib/theme.ts`의 `themeInitScript`).
- **`dangerouslySetInnerHTML`**: 문자열을 태그 안에 그대로 넣는 React 문법. 사용자 입력을 넣으면 XSS에 뚫려서 이름이 무섭다. 여기는 우리가 쓴 고정 문자열이라 안전하다.
- **`suppressHydrationWarning`이 이제 실제로 필요하다**: 스크립트가 서버 HTML에 없던 `data-theme`을 `<html>`에 붙이기 때문이다.
  > React 소스(`react-dom-client.development.js`)에서 확인한 동작: 서버 HTML에 없던 속성은 `extraAttributes`로 모아 경고하고, `suppressHydrationWarning`이 있으면 건너뛴다. 실제로 속성을 지우고 경고가 뜨는 것을 재현하지는 못했다. (확인 방법 6번에서 직접 해 보기)
- **테마 값은 React state가 아니다**: `<html data-theme>` 속성 하나가 '진짜 값'이다. 버튼은 읽고 뒤집기만 한다.
  → Header에 state가 필요 없어져서 **Header가 다시 서버 컴포넌트**가 됐다. `'use client'`는 ThemeToggle 버튼 하나뿐이다.
- 실무에서는 이 기능을 `next-themes` 라이브러리로 한 줄에 해결하기도 한다. 여기서는 원리를 이해하려고 직접 만들었다.

**7. 아이콘과 버튼 이름도 CSS로 바꾼다 — 하이드레이션 불일치 피하기**
```tsx
<Button variant="ghost" size="icon" onClick={toggle}>
  <span className={styles.showInLight}><Moon /><span className="sr-only">다크 모드로 전환</span></span>
  <span className={styles.showInDark}><Sun /><span className="sr-only">라이트 모드로 전환</span></span>
</Button>
```
```scss
.showInDark { display: none; }
:global([data-theme='dark']) {
  .showInLight { display: none; }
  .showInDark { display: flex; }
}
```
- React state로 아이콘을 고르면, 서버는 항상 '라이트'로 그리고 브라우저는 '다크'라서 **서버 HTML과 브라우저 결과가 어긋난다**(하이드레이션 불일치).
- CSS로 바꾸면 React는 테마를 몰라도 되고, 첫 화면부터 올바른 아이콘이 보인다.
- `display: none`은 스크린리더도 읽지 않으므로, 보이는 쪽 문구만 버튼 이름이 된다. → `aria-label` 없이도 상황에 맞는 이름이 읽힌다.

**8. 상태는 속성으로, 모양은 CSS로 — `[aria-pressed='true']`**
```scss
.chip[aria-pressed='true'] { background-color: var(--color-primary); }
```
선택된 카테고리를 `selected ? 'active' : ''` 클래스로 바꾸지 않고, 이미 있는 `aria-pressed` 속성을 선택자로 쓴다.
스크린리더에 알리는 상태와 눈에 보이는 모양이 **항상 함께** 바뀐다. (클래스 방식은 aria를 빼먹는 실수가 생기기 쉽다)

**9. 한글 웹폰트 — Pretendard dynamic subset**
- 한글은 글자 수가 많아 폰트 파일이 크다. (Pretendard 가변 폰트 한 파일 = **2MB**)
- dynamic subset: 폰트를 약 90조각으로 나눠 두고, CSS `unicode-range`로 **화면에 나온 글자가 든 조각만** 받는다.
- 폰트 스택: Pretendard를 못 불러오면 `Apple SD Gothic Neo`, `Malgun Gothic` 등 운영체제 기본 한글 폰트로 대체한다.
- ※ Next.js의 `next/font`는 영문 구글 폰트에는 좋지만, 2MB 한 파일을 통째로 preload하게 되어 이 경우에는 쓰지 않았다.

**10. 접근성 보강 (전환하면서 함께 고친 것)**
- 검색창에 `aria-label="상품 검색"`: placeholder는 입력하면 사라지고 이름으로 읽히지 않을 수 있다.
- 카테고리 칩에 `:focus-visible` 테두리 추가 (Tailwind 때는 브라우저 기본 표시였다).
- 카드 떠오르기 효과는 `prefers-reduced-motion: reduce`(모션 줄이기 설정) 사용자에게는 끈다.
- `color-scheme: dark`: 스크롤바·체크박스·select 같은 브라우저 기본 부품도 다크 모드에 맞춰 그린다.

### 확인 방법
1. `npm run dev` 후 목록·검색·카테고리·정렬·품절 숨기기가 **Tailwind 때와 똑같이 보이고 동작**하는지
2. 다크 모드 버튼 → **새로고침(F5)해도 다크 모드가 유지**되는지. 새로고침할 때 흰 화면이 번쩍이지 않는지
3. 개발자 도구 Application 탭 → Local Storage에 `theme: dark`가 저장되는지. 지우고 새로고침하면 운영체제 설정을 따르는지
4. 개발자 도구 Elements에서 `<html data-theme="dark">`, 카드의 클래스가 `Card-module-scss-module__...__card` 같은 고유 이름인지
5. 브라우저 폭을 줄여 가며 그리드가 4 → 3 → 2 → 1열로 바뀌는지 (1280 / 1024 / 640px 기준)
6. `layout.tsx`에서 `suppressHydrationWarning`을 잠깐 지우고, 다크 모드로 새로고침 → 콘솔에 하이드레이션 경고가 뜨는지 확인 후 되돌리기
7. 스크린리더(Windows 내레이터: Ctrl+Win+Enter) 또는 개발자 도구 Accessibility 탭에서 다크 모드 버튼 이름이 테마에 따라 "다크 모드로 전환" / "라이트 모드로 전환"으로 바뀌는지
8. `_tokens.scss`에서 `$radius-xl`을 `0`으로 바꿔 보기 → 모든 카드 모서리가 한 번에 바뀌는지 (확인 후 되돌리기)
9. `npm run build`, `npm run lint`, `npx tsc --noEmit`이 에러 없이 끝나는지

### 알려진 한계
- `global-error.tsx`는 레이아웃 대신 그려지는 화면이라 테마 스크립트가 없어서 항상 라이트로 보인다. (Next.js 문서에도 명시된 동작. 거의 볼 일이 없는 화면이라 그대로 둠)
- 상세 페이지 갔다가 돌아오면 필터가 초기화된다 → Step 4 (URL 쿼리)

---

## 참고: 전환 전 기록 — react-router로 했던 (구) 3-1
> 커밋 `cbd77f1`. Vite + react-router 7로 목록 · 상세 뼈대 · 404 페이지를 나눴던 단계. 개념은 Next.js에서도 그대로 쓰이므로 요약해 남긴다.

- **SPA와 클라이언트 라우팅**: HTML은 `index.html` 하나. 주소가 바뀌면 React가 화면만 교체한다. Next.js의 `Link`도 같은 방식으로 이동한다.
- **`<Link>` vs `<a href>`**: 앱 안 이동은 `Link`(상태 유지), 외부 사이트는 `a`. `Link`도 실제로는 `<a>`로 그려져 접근성·새 탭 열기가 유지된다.
- **동적 경로**: react-router `path="/products/:id"` + `useParams()` → Next.js `app/products/[id]/page.tsx` + `params`.
- **늘린 링크(stretched link) 패턴** — 퍼블리셔 강점
  - 카드 전체를 `<a>`로 감싸면 스크린리더가 카드 안의 모든 글자를 링크 이름으로 읽는다.
  - 링크는 상품명에만 걸고, `::after`를 카드 크기만큼 늘려 **클릭 영역만 카드 전체로** 만든다.
  - 키보드 포커스는 `:has(:focus-visible)`로 카드 전체에 테두리를 그린다. (3-2에서 SCSS로 옮김)
- **404 페이지**: react-router에서는 `path="*"`로 직접 연결 → Next.js는 `not-found.tsx`.
