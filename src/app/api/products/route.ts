import type { NextRequest } from 'next/server'
import { getProducts } from '@/lib/products'
import { parseCatalogParams, parseIdList } from '@/lib/catalogParams'
import { serverErrorResponse } from '@/lib/apiResponse'
import type { ProductListResponse } from '@/types/api'

// 상품 목록 API — GET /api/products (Step 6-1)
//
// Route Handler란?
// - app 폴더 안의 route.ts 파일. page.tsx가 '화면(HTML)'을 돌려준다면 route.ts는 '데이터(JSON)'를 돌려준다.
// - 함수 이름이 HTTP 메서드다: GET, POST, PUT, DELETE ... (지금은 읽기만 하므로 GET)
// - 브라우저의 fetch('/api/products')가 이 함수를 실행시키고, 돌려준 Response가 응답이 된다.
// - 실제 회사에서는 백엔드 서버가 따로 있는 경우가 많다. 그 API를 흉내 낸 '목 API'로 화면 쪽 fetch를 먼저 만들어 둔다.
//   (Step 8에서 이 안쪽만 DB로 바뀐다. 주소와 응답 모양은 그대로)
//
// 쿼리 (목록 화면 주소와 같은 이름 — lib/catalogParams.ts를 그대로 쓴다)
//   ?q=무선 &category=오디오 &sort=price-asc|price-desc|rating &instock=1
//   ?ids=1,2,5   이 상품들만 (장바구니, Step 6-3). 정수만, 최대 100개 — 아주 긴 목록으로 서버를 괴롭히는 요청을 막는다
// 응답: { items: Product[], total: number }  (types/api.ts)
//
// 예) curl 'http://localhost:3000/api/products?category=오디오&sort=rating'

// NextRequest: 웹 표준 Request에 Next.js가 편의 기능을 더한 것. nextUrl.searchParams로 쿼리를 바로 읽는다
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    // null: 카테고리를 검사하지 않는다 → 없는 카테고리는 결과 0개 (카테고리 목록을 먼저 조회하지 않아도 된다)
    const filters = parseCatalogParams(searchParams, null)
    const data: ProductListResponse = await getProducts({ filters, ids: parseIdList(searchParams.get('ids')) })
    // Response.json(): 객체를 JSON 문자열로 바꾸고 Content-Type: application/json 헤더를 붙여 준다
    return Response.json(data)
  } catch (error) {
    return serverErrorResponse(error, '상품 목록을 불러오지 못했습니다.')
  }
}
