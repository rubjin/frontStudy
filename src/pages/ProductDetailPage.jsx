import { Link, useParams } from 'react-router'

// 상품 상세 페이지 — 주소 "/products/:id" (Step 3-1: 뼈대만)
//
// 지금은 라우팅이 동작하는지 확인하는 용도로 id만 보여 준다.
// 실제 상품 정보 화면은 Step 3-2에서 완성한다.
function ProductDetailPage() {
  // useParams: 주소의 ':id' 자리에 들어온 값을 꺼낸다.
  // 예) /products/3 → { id: '3' }
  // ⚠️ 주소에서 온 값은 항상 '문자열'이다. 숫자 id와 비교하려면 Number()로 바꿔야 한다. (3-2에서 사용)
  const { id } = useParams()

  return (
    <div className="py-20 text-center">
      <p className="text-lg font-semibold">상품 #{id} 상세 페이지</p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Step 3-2에서 완성할 예정입니다.</p>
      {/* Link: <a href>처럼 보이지만, 페이지를 새로 불러오지 않고 React가 화면만 바꾼다 */}
      <Link to="/" className="mt-6 inline-block text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
        ← 목록으로
      </Link>
    </div>
  )
}

export default ProductDetailPage
