import type { NextRequest } from 'next/server'
import { getProduct } from '@/lib/products'
import { errorResponse, serverErrorResponse } from '@/lib/apiResponse'
import type { Product } from '@/types/product'

// 상품 하나 API — GET /api/products/3 (Step 6-1)
//
// [id] 폴더: 페이지의 products/[id]와 같은 '동적 경로'. 주소의 3이 params.id로 들어온다.
// RouteContext<'/api/products/[id]'>: Next.js가 빌드할 때 만들어 주는 타입 도우미. params의 모양(id: string)을 알려 준다.
// Next.js 15부터 params는 Promise라서 await로 꺼낸다 (page.tsx와 같다)
//
// 응답: 200 Product / 404 { error } / 500 { error }

export async function GET(_request: NextRequest, context: RouteContext<'/api/products/[id]'>) {
  try {
    const { id } = await context.params
    const product: Product | undefined = await getProduct(id)
    // 없는 상품은 404(Not Found). 200에 null을 보내지 않는다 — 상태 코드만 보고도 '없음'을 알 수 있게
    if (!product) return errorResponse(404, '상품을 찾을 수 없습니다.')
    return Response.json(product)
  } catch (error) {
    return serverErrorResponse(error, '상품 정보를 불러오지 못했습니다.')
  }
}
