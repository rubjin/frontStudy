
//목록 조회 파라미터 타입정의
//화면의 상태와 주소를 서로 변환하는 함수

// 1. 상품 목록의 검색·필터·정렬 상태를 정의한다.
// 2. URL 주소에서 필터 값을 읽는다.
// 3. API에서 사용하는 상품 ID와 페이지 정보를 읽는다.
// 4. 필터 값을 URL 주소로 변환한다.

import { ALL_CATEGORIES } from "@/lib/filterProducts";
import { SORT_OPTIONS, type SortValue } from '@/lib/sortProducts'


//상품목록 필터 상태 객체 구조 정의
export interface CatalogFilters {
    query: string
    category: string
    sort: SortValue
    hideSoldOut: boolean
}

//화면에 아무 검색/필터 미적용시 사용할 기본값
export const DEFAULT_FITLER: CatalogFilters = {
    query: '',
    category: ALL_CATEGORIES,
    sort: 'default',
    hideSoldOut: false
}

//Url에서 사용할 키 이름 (ex. query 는 'q'로 사용)
const KEYS = { query: 'q', category: 'category', sort: 'sort', hideSoldOut: 'instock'}

//정렬값 검사용 목록. 정렬옵션에서 실제값만 뽑아서 Set에 정리(사용자 주소 직접수정을 통해 잘못된값 들어올 가능성때문)
//Set 중복된 값을 허용하지 않는 자료구조 <- 타입을 알아낼 수 있으면 '<>'생락가능
const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((option => option.value)))

//url 주소 검색 조건을 읽어서 객체로 반환하는 함수
//url 검색조건 : ?q=셔츠&category=상의&instock=1 -> parseCatalogParams() 값을읽고, 유효성검사, 기본값 적용
//Pick<>  URLSearchParams : url 검색조건을 다루는 객체타입에서 get(선택할 메서드 이름)에 해당하는 부분만 선택
// (URLSearchParams객체에 덜 의존하는 형태로 설계할 수 있으므로)
export function parseCatalogParams(
    params: Pick<URLSearchParams, 'get'>,
    categories: readonly string[] | null, //사용가능한 카테고리 목록(변경불가 문자열 배열 또는 null(목록없음))
): CatalogFilters {
    const sort = params.get(KEYS.sort) ?? '' //왼쪽값이 null or undefined 면 오른쪽 값 사용
    const category = params.get(KEYS.category) ?? '' //
    return {
        query: params.get(KEYS.query) ?? DEFAULT_FITLER.query,
        category: category && (categories === null || categories.includes(category)) ? category : DEFAULT_FITLER.category,
        sort: SORT_VALUES.has(sort) ? (sort as SortValue) : DEFAULT_FITLER.sort, //as SortValue 타입단언
        hideSoldOut: params.get(KEYS.hideSoldOut) === '1', //'1'을 쓰는 이유는 쿼리값이 문자열이기 때문
    }
}
