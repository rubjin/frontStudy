import 'server-only'
import type { ApiErrorResponse } from '@/types/api'

// Route Handler들이 함께 쓰는 응답 도우미 (Step 6-1)
//
// 실패 응답을 항상 같은 모양({ error: { message } })으로 보내야 브라우저 쪽(lib/api.ts)이 한 가지 방법으로 읽을 수 있다.
// 서버 전용(server-only). Route Handler(app/api/**/route.ts)에서만 쓴다.

export function errorResponse(status: number, message: string): Response {
  const body: ApiErrorResponse = { error: { message } }
  return Response.json(body, { status })
}

// 예상하지 못한 실패(500). 자세한 원인은 서버 로그에만 남기고, 응답에는 일반적인 문구만 보낸다.
// (에러 내용을 그대로 보내면 내부 구조·파일 경로 같은 정보가 밖으로 새어 나갈 수 있다)
export function serverErrorResponse(error: unknown, message: string): Response {
  console.error(error)
  return errorResponse(500, message)
}
