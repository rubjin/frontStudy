//api 응답타입 (서버전용 공통함수)

//구조 api route handler(ex. app/api/product/route.ts)
//    -> 공통 에러함수 호출 (ex. errorResponse() or serverErrorResponse())
//    -> 일관된 JSON응답, HTTP상태코드도 함께 전달

import 'server-only' //서버전용
import type { ApiErrorResponse } from '@/types/api' //API에러 응답 데이터 구조 정의타입

//body: 응답으로 보낼 JSON데이터
//ApiErrorResponse: 응답데이터 구조검사 타입
export function errorResponse(status: number, message: string): Response {
    const body: ApiErrorResponse = { error: { message } }
    return Response.json(body, { status })
}

//예상못한 서버오류 시 1. 오류정보 서버로그에 남김 2. 에러응답 반환
//error: unknwon 타입이유는 오류전달 타입 미리 확정불가
export function serverResponse(error: unknown, message: string): Response {
    console.error(error)
    return errorResponse(500, message)
}