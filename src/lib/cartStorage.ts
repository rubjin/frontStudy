import type { CartItem } from '@/types/cart'

// 장바구니를 브라우저(localStorage)에 저장하고 불러오는 함수 (Step 5-3)
//
// 왜 필요한가?
// - 장바구니 state는 CartProvider(=브라우저 메모리)에 있어서, 새로고침하거나 탭을 닫으면 사라진다.
// - localStorage는 브라우저에 '문자열'을 저장해 두는 곳이다. 사이트(도메인)별로 따로이고, 지우기 전까지 남는다.
//   (테마 저장 lib/theme.ts와 같은 곳. 로그인한 사용자의 장바구니를 서버에 저장하는 것은 Step 9)
//
// 이 파일은 '저장 형식'만 책임진다. 상품 데이터와 맞추는 정리(재고·판매 종료)는 lib/cart.ts의 sanitizeCartItems.

// 저장 이름. 다른 탭의 변경을 알아챌 때(storage 이벤트의 key)도 이 이름으로 구분한다
export const CART_STORAGE_KEY = 'shoppr-cart'

// 저장 형식의 버전
// 나중에 형식을 바꾸면(예: 옵션·색상 추가) 예전 형식으로 저장된 값을 알아보고 버리거나 바꿀 수 있게 번호를 함께 저장한다.
const STORAGE_VERSION = 1

// 저장되는 모양: {"version":1,"items":[{"productId":2,"quantity":3}]}
interface StoredCart {
  version: number
  items: CartItem[]
}

// 값 하나가 CartItem 모양인지 검사 — 반환 타입 'value is CartItem'은 '타입 가드'
// true를 돌려주면 그 뒤로 TypeScript가 value를 CartItem으로 본다.
// localStorage 값은 누구나(개발자 도구, 예전 버전 코드) 바꿀 수 있으니, 믿지 말고 모양을 확인한다.
// (주소 쿼리를 읽을 때 값을 검사한 Step 4-2의 parseCatalogParams와 같은 생각)
function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false
  const { productId, quantity } = value as Record<string, unknown>
  // Number.isInteger: 정수일 때만 true ('3', 1.5, NaN, null은 false)
  return Number.isInteger(productId) && Number.isInteger(quantity) && (quantity as number) >= 1
}

// 저장된 문자열 → 장바구니 항목. 잘못된 값이면 빈 배열
// 서버 렌더링 중에는 부르지 않는다(localStorage가 없다) → CartProvider의 useEffect 안에서만 부른다
export function loadCartItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    // JSON.parse: 문자열 → 객체. 깨진 문자열이면 에러를 던진다 → catch로
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return []
    const { version, items } = parsed as Partial<StoredCart>
    if (version !== STORAGE_VERSION || !Array.isArray(items)) return []
    // 모양이 맞는 항목만 남긴다 (하나가 깨졌다고 전부 버리지 않는다)
    return items.filter(isCartItem)
  } catch {
    // 사생활 보호 모드 등에서 localStorage 접근 자체가 막혔거나, JSON이 깨진 경우 → 빈 장바구니로 시작
    return []
  }
}

// 장바구니 항목 → 문자열로 저장
export function saveCartItems(items: CartItem[]): void {
  try {
    const value = JSON.stringify({ version: STORAGE_VERSION, items } satisfies StoredCart)
    // 같은 값이면 쓰지 않는다. 다른 탭에서 받은 값을 그대로 다시 저장하는 낭비를 막는다
    if (localStorage.getItem(CART_STORAGE_KEY) === value) return
    localStorage.setItem(CART_STORAGE_KEY, value)
  } catch {
    // 저장 공간이 꽉 찼거나 막힌 경우: 이번 방문 동안은 화면의 장바구니로 계속 쓸 수 있으니 무시한다
  }
}
