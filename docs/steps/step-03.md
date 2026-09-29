# Step 3. 실무 환경 전환 — Next.js · TypeScript · SCSS Module · Storybook

> 상태: 진행 중 (3-1 완료)

## 목표
지금까지는 Vite + JavaScript + Tailwind로 "React가 어떻게 동작하는지"를 익혔다.
실무 프론트엔드 채용 공고에서 가장 많이 보이는 조합은 **Next.js + TypeScript**이고, 퍼블리셔 출신의 강점은 **CSS 설계(SCSS)와 컴포넌트 문서화(Storybook)** 로 보여 줄 수 있다.
Step 3에서는 **화면은 그대로 두고, 그 아래의 개발 환경을 실무형으로 바꾼다.**

## 세부 단계
- [x] **3-1** Vite → Next.js(App Router) + TypeScript
- [ ] **3-2** Tailwind → SCSS Module (디자인 토큰, mixin, CSS 변수 다크 모드)
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
- 새로고침하면 다크 모드가 풀린다 → 3-2
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
