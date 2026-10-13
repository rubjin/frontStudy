
//상품데이터 구조 정의 설계도, 데이터 저장하는 파일은 아님

export interface ProductImage {
  src: string
  width: number
  height: number
}

export interface Product {
  id: number
  name: string
  price: number
  category: string
  rating: number
  stock: number
  image?: ProductImage
}