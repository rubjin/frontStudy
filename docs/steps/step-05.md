# Step 5. 장바구니 — Context + useReducer

> 상태: 진행 중 (5-1 완료)

## 목표
지금까지의 상태(검색어·필터)는 **한 화면 안에서만** 쓰였다. 장바구니는 다르다.
- 상세 페이지에서 담고, 헤더에서 개수를 보고, `/cart`에서 목록을 본다. **멀리 떨어진 컴포넌트들이 같은 상태를 나눠 쓴다.**
- 담기·수량 변경·삭제처럼 **바꾸는 방법이 여러 가지**이고, "재고보다 많이 담을 수 없다" 같은 규칙이 있다.

이 두 문제를 React 기본 기능인 **Context**(나눠 쓰기)와 **useReducer**(규칙을 한 곳에)로 푼다.

### 왜 Zustand가 아니라 Context + useReducer인가?
- 설치 없이 React만으로 되는 기본기다. 면접에서 "전역 상태를 어떻게 관리했나"의 기본 답이 된다.
- Zustand·Redux Toolkit은 이 구조(저장소 + 바꾸는 함수)를 더 편하게 만든 도구다. 기본 구조를 먼저 알면 도구를 고를 이유를 설명할 수 있다.

## 세부 단계
- [x] **5-1** 장바구니 상태 기본: reducer + Context Provider + `useCart`, 상세 '장바구니 담기', 헤더 개수 배지, 최소 `/cart`
- [ ] **5-2** 장바구니 페이지 완성: 수량 +/−, 삭제, 합계, 사진
- [ ] **5-3** localStorage 저장: 새로고침 유지, 하이드레이션 불일치 처리, 다른 탭과 동기화
- [ ] **5-4** 마무리: 목록 카드에서 바로 담기, 담기 알림, 재고 한도 안내

---

## 5-1. 장바구니 상태 기본

### 구조
```
layout.tsx (서버)
└ <CartProvider>                 ← 장바구니 state가 여기 있다 (useReducer)
   ├ <Header /> (서버)
   │  └ <CartLink />             ← useCart().count → 배지 숫자
   └ <main>{children}</main>
      ├ /products/2
      │  └ ProductDetail (서버)
      │     └ <AddToCartButton /> ← useCart().addItem(product)
      └ /cart
         └ <CartContents />      ← useCart().items → 목록
```

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/types/cart.ts` (새 파일) | `CartItem { productId, quantity }`, `CartState { items }` |
| `src/lib/cart.ts` (새 파일) | `cartReducer`(담기 규칙), `getCartCount`·`getQuantityInCart`(계산 함수) — React와 무관한 순수 함수 |
| `src/components/CartProvider.tsx` (새 파일) | `useReducer`로 state를 들고 Context로 나눠 줌. `useCart()` 훅 |
| `src/components/AddToCartButton.tsx` (새 파일) | 담기 버튼. 품절·최대 수량이면 비활성, 결과를 `role="status"`로 알림 |
| `src/components/CartLink.tsx` (새 파일) | 헤더의 장바구니 링크 + 개수 배지 |
| `src/components/CartContents.tsx` (새 파일) | `/cart`의 목록 (최소 버전), 빈 장바구니 안내 |
| `src/app/cart/page.tsx` (새 파일) | `/cart` 페이지. 서버 컴포넌트, `title: '장바구니'`, 검색 제외(`robots: { index: false }`) |
| `src/app/layout.tsx` | Header와 main을 `<CartProvider>`로 감쌈 |
| `src/components/Header.tsx` | 오른쪽에 `CartLink` + `ThemeToggle` 묶음 |
| `src/components/ProductDetail.tsx` | 버튼 줄에 `AddToCartButton` |
| `src/components/icons.tsx` | `Cart` 아이콘 |
| `.storybook/preview.tsx` | 모든 스토리를 `CartProvider`로 감쌈 |
| `src/components/Cart.stories.tsx` (새 파일) | 기본·품절·링크 단독·빈 장바구니·함께 동작 |

### 핵심 개념

**1. Context — 멀리 떨어진 컴포넌트에 값 나눠 주기**
- 헤더의 배지와 상세의 버튼은 공통 부모가 `layout.tsx`뿐이다. props로 넘기면 중간 컴포넌트(Header, page, ProductDetail)가 쓰지도 않는 값을 계속 넘겨야 한다(**props drilling**).
- Context는 위에서 한 번 깔아 두면 아래 어디서든 꺼내 쓰는 통로다.
```tsx
const CartContext = createContext<CartContextValue | null>(null)   // 1) 통로 만들기
<CartContext value={value}>{children}</CartContext>                 // 2) 위에서 값 넣기 (React 19 문법)
const { count } = useContext(CartContext)                           // 3) 아래에서 꺼내기 → useCart()로 감쌈
```

**2. useReducer — 바꾸는 규칙을 한 곳에**
```tsx
const [state, dispatch] = useReducer(cartReducer, { items: [] })
dispatch({ type: 'add', productId: 2, maxQuantity: 5 })   // 컴포넌트는 "무엇을"만 알린다
// → React가 cartReducer(state, action)을 실행 → 결과로 다시 그림  // "어떻게"는 reducer가 정한다
```
- 재고 한도 규칙은 reducer에 있다. 버튼이 '최대 수량' 상태로 비활성화되는 것은 사용자에게 **이유를 보여 주는 것**이고, 규칙 자체는 버튼이 몇 개로 늘어나도 reducer 하나다.
- reducer는 **순수 함수**다: 받은 state를 고치지 않고 새 객체를 돌려준다. (`push`나 `item.quantity++`를 쓰면 React가 바뀐 줄 몰라서 화면이 안 바뀐다)

**3. 장바구니에는 id와 수량만**
가격·이름을 복사해 두면 가격이 바뀌었을 때 장바구니만 옛날 가격이 된다. id만 두고 보여 줄 때 상품 데이터에서 찾는다(4-2의 "같은 정보는 한 곳에만"). 저장할 값도 작아서 5-3의 localStorage에 유리하다.

**4. 클라이언트 Provider로 서버 컴포넌트를 감싸도 된다**
`CartProvider`는 `'use client'`지만 `children`으로 받은 Header·페이지는 서버에서 이미 그려진 결과라 **서버 컴포넌트 그대로**다. 그래서 Provider는 children을 받는 모양으로 만든다. (Provider 파일 안에서 직접 import해 그리면 클라이언트 컴포넌트가 된다)

**5. Context value와 useMemo**
Context는 value가 **다른 객체**가 되면 꺼내 쓰는 모든 컴포넌트를 다시 그린다. `useMemo`로 state가 바뀔 때만 새 객체를 만든다.

**6. 접근성**
- 담기 버튼: 눌러도 화면 위쪽 배지만 바뀌면 스크린리더 사용자는 담겼는지 모른다 → `role="status"` 문구 "장바구니에 담았습니다. 현재 n개". 영역은 처음부터 DOM에 두고(비어 있음), 숫자를 넣어 매번 글자가 달라지게 했다.
- 헤더 링크: 아이콘뿐이라 `sr-only`로 "장바구니", 배지 숫자 뒤에 "개" → 읽히는 이름 "장바구니 5 개".
- 알림 문구는 `display: contents` + `order`로 버튼 줄 아래에 놓았다(버튼 사이에 끼지 않게).

### 확인 방법
1. `npm run build` → `○ /cart`, 상세는 그대로 `●`
2. 상세(재고 5개짜리 스마트워치 `/products/2`)에서 '장바구니 담기' → 헤더 배지 1, 문구 "현재 1개"
3. 다섯 번 → 버튼이 '최대 수량을 담았습니다'로 비활성화
4. 목록으로 → 다른 상품 담기 → 배지가 이어서 증가 → 헤더 장바구니 → `/cart`에 두 상품
5. 품절 상품(`/products/3`) → '품절' 비활성화
6. 새로고침 → 장바구니가 비어 있음 (**아직 정상**, 5-3에서 저장)
7. Storybook `Cart/AddToCartButton` → `Together`에서 버튼·배지·목록이 함께 바뀌는지

검증 결과 (production 빌드 + headless Chrome)
- 위 2~6 모두 확인. 링크 이름 "장바구니" → "장바구니 1 개" → "장바구니 6 개"
- 상세(담은 뒤)·`/cart`(목록·빈 화면) axe 라이트·다크 위반 0, 콘솔 에러·하이드레이션 경고 0
- 1280·390px에서 알림 문구가 버튼 줄 아래에 표시
- Storybook 스토리 43개 × 라이트/다크 렌더링 정상·axe 위반 0, `Together` 클릭 → 배지 2개·목록 2줄
- `tsc`·ESLint·Stylelint·Prettier 통과

### 알려진 한계 · 다음에 할 일
- 새로고침하면 비워진다 → 5-3
- `/cart`는 수량 조절·삭제·합계가 없다 → 5-2
- 상품 데이터를 클라이언트에서 목 데이터 파일로 찾는다(`CartContents`). Step 6에서 API로 바뀐다.
