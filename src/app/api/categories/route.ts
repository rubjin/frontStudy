import { getCategories } from '@/lib/products'
import { serverErrorResponse } from '@/lib/apiResponse'
import type { CategoryListResponse } from '@/types/api'

// 카테고리 목록 API — GET /api/categories (Step 6-1)
// 응답: { items: ['전체', '오디오', ...] }
//
// request를 읽지 않는 GET은 Next.js가 빌드 때 미리 만들어 둘 수 있다(정적).
// 하지만 상품 데이터(Step 8 DB)는 바뀌므로 요청마다 만들게 한다.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data: CategoryListResponse = { items: await getCategories() }
    return Response.json(data)
  } catch (error) {
    return serverErrorResponse(error, '카테고리를 불러오지 못했습니다.')
  }
}
