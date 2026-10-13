//셀렉트 소팅을 위한 것
import type { Product } from '@/types/product'

//SortVaule 타입정의(타입별칭) type : 정해진 값 중 하나만 허용하도록 타입 정의
export type SortValue = 'default' | 'price-asc' | 'price-desc' | 'rating' 

//데이터 구조 정의(직접만든타입) interface : 객체가 어떤 속성을 가져야 하는지 구조를 정의
export interface SortOption {
  value: SortValue
  label: string 
}

//const 변수에 다른값 재할당 불가, SortOption 타입의 객체 여러개를 담는 배열
//SortOption[] 데이터의 형태를 정하는 타입
//: 는 변수의 타입을 지정할때
export const SORT_OPTIONS: SortOption[] = [
  { value: 'default', label: '기본순'},
  { value: 'price-asc', label: '가격 낮은순'},
  { value: 'price-desc', label: '가격 높은순'},
  { value: 'rating', label: '평점 높은순'},
]

//상품을 정렬하는 로직
//Record는 특정 값의 타입을 지정해 객체 구조 정의하는 typescript 유틸리티 타입
//Partial(키와 값 정의) 객체속성을 선택사항으로 만듦, 4가지 정렬 중 일부만 정의가능
//SortValue 객체에서 사용할 수 있는 키 타입
//(a: Product, b: Product) => number 두 상품을 받아 숫자로 반환하는 함수타입
//일반적 영문식별자는 따옴표 생략가능
const COMPARATORS: Partial<Record<SortValue, (a: Product, b: Product) => number>> = {
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'rating': (a, b) => b.rating - a.rating 
}

//SortValue, COMPARATORS를 연결해 상품목록 재 정렬
//sortProducts        함수이름
//products: Product[] 상품 객체 배열을 매개변수로 받음
//sort: SortValue     정렬기준을 매개변수로 받음
//: Product[] 함수가 반환할 값의 타입을 정의
export function sortProducts(products: Product[], sort: SortValue): Product[] {
 const compare = COMPARATORS[sort]  //정렬함수 가져오기
 if (!compare) return products      //비교함수 없을때
 return [...products].sort(compare) //복사한 배열 정렬
} 