# Step 4. 라우팅 심화 — 상품 상세 · URL 상태 · 로딩/에러

> 상태: 진행 중 (4-1 완료)

## 목표
Step 3에서 Next.js로 옮기면서 상세 페이지는 "주소의 id를 보여 주는 뼈대"만 만들었다.
Step 4에서는 **주소(URL)를 제대로 다루는 법**을 익힌다.
- 주소마다 다른 내용과 SEO 정보, 없는 주소는 404
- 검색·필터·정렬 상태를 주소에 담아서 새로고침·공유·뒤로 가기에도 유지
- 페이지를 불러오는 중·에러 화면을 구간별로

## 세부 단계
- [x] **4-1** 상품 상세 완성: 데이터 함수, `notFound()`, `generateMetadata`, `generateStaticParams`, 상세 화면 컴포넌트
- [ ] **4-2** 검색·카테고리·정렬·품절 숨기기를 `searchParams`(URL 쿼리)로
- [ ] **4-3** `loading.tsx`(구간 로딩 화면)·구간별 `error.tsx`

---

## 4-1. 상품 상세 페이지 완성

### 바뀐 구조
```
주소 /products/3
  └ app/products/[id]/page.tsx       ← 주소로 상품 찾기 · 404 · 제목/설명 (데이터 담당)
       ├ lib/products.ts  getProduct('3')   ← 데이터 가져오기 (지금은 목 데이터, Step 6에서 API)
       └ components/ProductDetail.tsx        ← 화면 그리기 (Storybook으로 상태별 확인)
```

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/lib/products.ts` (새 파일) | `getProduct(id)`: 주소의 id로 상품 찾기 · `getProductIds()`: 미리 만들 주소 목록 |
| `src/components/ProductDetail.tsx` (새 파일) | 상세 화면. 이동 경로, 원본 비율 사진, 상품명(h1)·평점·가격·재고 상태, 목록으로 버튼 |
| `src/components/ProductDetail.module.scss` (새 파일) | 768px 이상 두 칸 배치, 사진 최대 높이 제한, 재고 상태별 색(`[data-status]`) |
| `src/components/ProductDetail.stories.tsx` (새 파일) | 기본 · 품절 임박 · 품절 · 세로 사진 · 가로 사진 · 이미지 없음 · 긴 이름 |
| `src/app/products/[id]/page.tsx` | 뼈대 → `generateStaticParams` + `dynamicParams = false` + `generateMetadata` + `notFound()` |
| `src/app/products/[id]/page.module.scss` | 삭제 (화면이 ProductDetail로 옮겨감) |
| `src/app/not-found.tsx` | 주석만 수정 (없는 상품도 이 화면이 맡음) |

### 핵심 개념

**1. 페이지와 데이터 사이에 함수 한 겹 (`lib/products.ts`)**
```ts
export async function getProduct(id: string): Promise<Product | undefined> {
  return products.find((p) => String(p.id) === id)
}
```
- 페이지가 `products` 배열을 직접 뒤지면, Step 6(API)·Step 8(DB)로 바꿀 때 페이지를 전부 고쳐야 한다. 함수를 거치면 **이 파일 안쪽만** 바꾸면 된다.
- 지금은 바로 끝나는 일인데 `async`인 이유: API·DB는 기다려야 한다. 처음부터 Promise를 돌려주면 나중에 `fetch`로 바꿔도 부르는 쪽(`await getProduct(id)`)은 그대로다.
- **id를 문자열로 비교**: 주소에서 온 값은 항상 문자열이다. `Number(id) === p.id`로 비교하면 `Number('03')`, `Number('3.0')`이 모두 3이 되어 같은 상품이 여러 주소로 열린다(검색엔진은 '중복 콘텐츠'로 본다). `String(p.id) === id`는 `'3'` 하나만 통과시킨다.

**2. `notFound()` — 없으면 404**
```ts
const product = await getProduct(id)
if (!product) notFound()
return <ProductDetail product={product} />   // 여기서 product는 Product 타입 (undefined 아님)
```
- 에러를 던져서 실행을 멈추므로 `return`이 필요 없다. 반환 타입이 `never`라서 TypeScript도 다음 줄의 `product`가 반드시 있다고 안다(타입 좁히기).

**3. `generateMetadata` — 주소마다 다른 제목·설명**
- 고정 제목은 `export const metadata = {...}`, 주소에 따라 다르면 `generateMetadata` 함수.
- 결과: `<title>무선 노이즈캔슬링 헤드폰 | Shoppr</title>`, `<meta name="description" content="오디오 · ₩189,000 · 평점 4.6">`, `og:title`
- 사진 미리보기(`og:image`)는 사이트 전체 주소(`metadataBase`)가 필요해서 배포 단계(Step 11)에서 추가한다.

**4. `generateStaticParams` — 빌드할 때 미리 만들기 (SSG)**
```ts
export async function generateStaticParams() {
  const ids = await getProductIds()
  return ids.map((id) => ({ id }))   // [{ id: '1' }, { id: '2' }, ...]
}
```
빌드 결과가 바뀐다.
```
전: └ ƒ /products/[id]          ← 요청 올 때마다 서버에서 만듦 (Dynamic)
후: └   /products/[id]
      ├ ● /products/1           ← 빌드할 때 HTML을 미리 만들어 둠 (SSG)
      └ ● [+11 more paths]
```
상품 12개는 자주 안 바뀌므로 미리 만들어 두면 요청이 오자마자 완성된 HTML을 보낸다.

**5. Next.js 버그를 만나서 `dynamicParams = false`로 우회** ⚠️
검증하다가 **없는 상품 주소(`/products/999`)에서 다크 모드가 풀리는 것**을 발견했다.

| | `/nope` (맞는 경로 없음) | `/products/999` (page에서 `notFound()`) |
|---|---|---|
| 상태 코드 | 404 | 404 |
| 서버가 보낸 HTML | `<html lang="ko">` + 헤더 + 404 화면 | **`<html id="__next_error__">` + 빈 body** |
| 브라우저 | 정상 | JS가 화면을 처음부터 그림 → `data-theme` 사라짐(다크 모드 풀림), 탭 제목 틀림 |
| JS 꺼짐 | 정상 | 빈 화면 |

원인을 좁혀 간 순서:
1. `generateStaticParams`를 빼도 같음 → 정적 생성 탓이 아님
2. 상품 전용 `not-found.tsx`를 빼도 같음 → 그 파일 탓이 아님
3. 기존 `/dev/skeleton`(production에서 `notFound()`)도 같음 → **page에서 `notFound()`를 부르면 항상**
4. Next.js 소스와 이슈 검색 → **16.3.6의 알려진 미해결 버그** [vercel/next.js#99287](https://github.com/vercel/next.js/issues/99287)
   - 404 화면을 감싸는 경계(`HTTPAccessFallbackBoundary`)가 클라이언트용 에러 경계라서 서버 렌더링 중에는 동작하지 않고, Next가 빈 껍데기로 대신한다.

우회: `export const dynamicParams = false`
- `generateStaticParams`에 없는 id는 page를 실행하지 않고 **'맞는 경로 없음'으로 처리** → `/nope`과 같은 정상 경로로 `app/not-found.tsx`가 나간다.
- 대가 1: 상품 전용 404 문구("상품을 찾을 수 없습니다")를 쓸 수 없어서 만들었던 `products/[id]/not-found.tsx`를 지웠다. 사이트 공통 404가 나온다.
- 대가 2: 빌드 뒤에 추가된 상품은 열리지 않는다. 목 데이터라 지금은 문제없지만, **Step 8(DB)에서 다시 판단**해야 한다. 그때 버그가 고쳐졌으면 `true`로 돌리고 상품 전용 404를 되살린다.
- `notFound()` 코드는 남겼다. 목록과 데이터가 어긋날 때의 안전장치이고, 타입 좁히기에도 필요하다.

> 배운 점: 상태 코드(404)만 보고 "됐다"고 하면 놓친다. **서버가 보낸 HTML**과 **실제 브라우저(다크 모드)**까지 확인해야 보이는 문제가 있다.

**6. 상세 화면의 마크업 (퍼블리셔 포인트)**
- **이동 경로(breadcrumb)**: `<nav aria-label="이동 경로">` + `<ol>` + 마지막 항목 `aria-current="page"`.
  구분 기호 `/`는 CSS `content: '/' / ''`로 그린다. 슬래시 뒤의 `''`는 **대체 텍스트**라서 스크린리더가 "슬래시"라고 읽지 않는다.
- **h1 = 상품명**: 페이지마다 주제가 하나. 목록 카드에서는 h3였던 상품명이 상세에서는 h1.
- **사진 alt**: 목록 카드는 옆에 상품명 링크가 있어서 `alt=""`(장식), 상세는 사진이 주인공이라 `alt={상품명}`.
- **원본 비율 사진**: 카드는 `fill` + `object-fit: cover`(정사각형에 잘라 채우기). 상세는 `width`·`height`를 넘겨 **원본 비율 그대로** + `max-height` + `object-fit: contain`(잘리지 않고 남는 곳은 배경). `width`·`height` 덕분에 사진이 오기 전에도 자리 크기가 정해져서 CLS 0.
- **LCP 사진 먼저 받기**: 상세 사진은 화면에서 가장 큰 요소(LCP)라 `loading="eager"` + `fetchPriority="high"`. (Next.js 16에서 `priority`는 폐지 예정, 문서도 이 두 속성을 권함)
- **재고 상태**: `data-status="low"` 같은 속성으로 상태를 표시하고 SCSS는 `&[data-status='low']`로 색만 바꾼다. 클래스를 조합할 필요가 없다.

### 확인 방법
1. `npm run build` → `/products/[id]` 아래에 `● /products/1` … 12개
2. `/products/1` → 상품명이 제목인 상세 화면, 탭 제목 `무선 노이즈캔슬링 헤드폰 | Shoppr`
3. `/products/11`(세로 사진) → 사진이 잘리지 않고 높이 560px 안에, 좌우에 배경
4. `/products/999`, `/products/abc`, `/products/03` → 404 "페이지를 찾을 수 없습니다". **다크 모드로 바꾼 뒤 열어도** 다크로 보이는지
5. 페이지 소스 보기(`Ctrl+U`)에서 `/products/999`가 `<html lang="ko">`로 시작하는지 (`__next_error__`면 버그 재발)
6. Storybook **Product/ProductDetail** → 품절 임박·품절·사진 비율별 모양

검증 결과 (production 빌드 + headless Chrome, 1280·390px × 라이트·다크)
- 상세 3개 + 404: axe 위반 0, 콘솔 에러 0, CLS 0
- 사진은 화면에 맞는 크기(`w=640`)로 전송
- Storybook ProductDetail 7개 × 라이트·다크: 렌더링·axe 모두 통과

### 알려진 한계 · 다음에 할 일
- **홈 화면 제목 순서**: 검증 중 홈에서 axe `heading-order`(moderate) 발견. h1("상품 목록") 다음이 바로 카드의 h3라 h2를 건너뛴다. 4-2에서 목록 화면을 고칠 때 함께 정리한다.
- **`/dev/skeleton`**도 production에서 같은 `notFound()` 버그로 빈 껍데기를 보낸다. 개발용 페이지라 영향은 작지만 기록해 둔다.
- 이동 경로의 카테고리는 아직 글자만. 4-2에서 필터를 주소로 옮기면 `/?category=오디오` 링크로 연결한다.
- 장바구니 담기 버튼은 Step 5.
