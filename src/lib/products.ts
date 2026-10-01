import { products } from '@/data/products'
import type { Product } from '@/types/product'

// 상품 데이터를 "가져오는" 함수 모음 (Step 4-1)
//
// 왜 페이지에서 products 배열을 직접 쓰지 않고 함수를 거치나?
// - 지금은 목 데이터(data/products.ts)지만, Step 6에서는 API, Step 8에서는 DB에서 가져온다.
// - 페이지가 배열을 직접 뒤지면 그때 페이지를 전부 고쳐야 한다.
//   함수를 한 겹 두면 이 파일 안쪽만 바꾸고, 페이지 코드는 그대로 둘 수 있다.
//
// 왜 async인가?
// - 지금은 배열에서 찾는 것이라 바로 끝나지만, API·DB는 응답을 '기다려야' 한다.
// - 처음부터 Promise를 돌려주게 만들어 두면, 나중에 fetch로 바꿔도 부르는 쪽(await getProduct(...))은 그대로다.

// 주소의 id(문자열)로 상품 하나를 찾는다. 없으면 undefined
//
// 주소에서 온 값은 항상 '문자열'이다. (/products/3 → '3')
// 숫자로 바꿔 비교(Number(id) === p.id)하지 않고, 상품 id를 문자열로 바꿔 비교한다.
// - Number('03'), Number('3.0'), Number(' 3')은 모두 3이 되어서 같은 상품이 여러 주소로 열린다.
//   (검색엔진은 주소가 다르면 다른 페이지로 보고 '중복 콘텐츠'로 취급한다)
// - 문자열 비교는 '3' 하나만 통과한다. 'abc'처럼 숫자가 아닌 값도 자연스럽게 undefined가 된다.
export async function getProduct(id: string): Promise<Product | undefined> {
  return products.find((p) => String(p.id) === id)
}

// 모든 상품 id 목록 — 상세 페이지를 빌드할 때 미리 만들어 둘 주소 목록에 쓴다 (generateStaticParams)
export async function getProductIds(): Promise<string[]> {
  return products.map((p) => String(p.id))
}
