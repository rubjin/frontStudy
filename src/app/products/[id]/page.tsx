import Link from 'next/link'

// 상품 상세 페이지 — 주소 "/products/:id" (Step 3-1: 뼈대만)
//
// 지금은 라우팅이 동작하는지 확인하는 용도로 id만 보여 준다.
// 실제 상품 정보 화면은 Step 4에서 완성한다.
//
// Step 3-1 (Next.js 전환): 동적 라우트
// - 폴더 이름을 [id]로 지으면 그 자리에 오는 값을 id라는 이름으로 받는다. (react-router의 :id)
//   예) /products/3 → params = { id: '3' }
// - react-router에서는 useParams() 훅으로 꺼냈지만, Next.js에서는 page의 props로 params가 들어온다.
// - Next.js 15부터 params는 Promise라서 await로 꺼낸다. 그래서 함수에 async를 붙였다.
//   (서버 컴포넌트는 async 함수가 될 수 있다. 나중에 여기서 바로 DB·API 데이터를 가져올 수 있다.)
// ⚠️ 주소에서 온 값은 항상 '문자열'이다. 숫자 id와 비교하려면 Number()로 바꿔야 한다. (Step 4에서 사용)

// PageProps<'/products/[id]'>: Next.js가 폴더 구조를 보고 자동으로 만들어 주는 타입.
// params 안에 id가 있다는 것까지 알고 있어서, 오타를 내면 에러가 난다.
export default async function ProductDetailPage({ params }: PageProps<'/products/[id]'>) {
  const { id } = await params

  return (
    <div className="py-20 text-center">
      <h1 className="text-lg font-semibold">상품 #{id} 상세 페이지</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Step 4에서 완성할 예정입니다.</p>
      {/* next/link의 Link: <a href>처럼 보이지만, 페이지를 새로 불러오지 않고 화면만 바꾼다 */}
      <Link href="/" className="mt-6 inline-block text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
        ← 목록으로
      </Link>
    </div>
  )
}
