import type { Metadata } from 'next'
import Link from 'next/link'
import { ButtonLink } from '@/components/ui/Button'
import { DeleteProductButton } from '@/components/DeleteProductButton'
import { getProducts } from '@/lib/products'
import { formatPrice } from '@/lib/format'
import { deleteProductAction } from './actions'
import styles from './page.module.scss'

// 상품 관리 목록 — 주소 "/admin/products" (Step 8-3)
//
// 서버 컴포넌트에서 DB를 바로 읽는다(lib/products). 품절 상품도 모두, id 순.
// 추가·수정이 끝나면 Server Action이 이 페이지로 redirect하며 ?done=created|updated|deleted 를 붙인다 → 결과 문구
//
// 수정·삭제 대상 id는 bind로 묶어 넘긴다: deleteProductAction.bind(null, product.id)

export const metadata: Metadata = { title: '상품 관리' }

const DONE_MESSAGES: Record<string, string> = {
  created: '상품을 추가했습니다.',
  updated: '상품 정보를 저장했습니다.',
  deleted: '상품을 삭제했습니다.',
}

export default async function AdminProductsPage({ searchParams }: PageProps<'/admin/products'>) {
  const { done } = await searchParams
  const message = typeof done === 'string' ? DONE_MESSAGES[done] : undefined
  const { items, total } = await getProducts()

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>상품 관리</h1>
        <ButtonLink href="/admin/products/new">상품 추가</ButtonLink>
      </div>

      {/* 결과 문구 — role="status"로 이동 직후 스크린리더가 읽는다 */}
      <p role="status" className={styles.done}>
        {message}
      </p>

      {/* 표: 행·열 의미가 있는 데이터는 div 대신 table. caption = 표 제목, th scope = 머리글 방향 */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="sr-only">상품 {total}개</caption>
          <thead>
            <tr>
              <th scope="col">번호</th>
              <th scope="col">상품명</th>
              <th scope="col">카테고리</th>
              <th scope="col" className={styles.number}>
                가격
              </th>
              <th scope="col" className={styles.number}>
                재고
              </th>
              <th scope="col">
                <span className="sr-only">관리</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <th scope="row">
                  {/* 상세 화면에서 실제로 어떻게 보이는지 확인 */}
                  <Link href={`/products/${product.id}`} className={styles.link}>
                    {product.name}
                  </Link>
                </th>
                <td>{product.category}</td>
                <td className={styles.number}>{formatPrice(product.price)}</td>
                <td className={styles.number}>{product.stock === 0 ? '품절' : product.stock}</td>
                <td>
                  <div className={styles.rowActions}>
                    <ButtonLink
                      href={`/admin/products/${product.id}/edit`}
                      variant="secondary"
                      aria-label={`${product.name} 수정`}
                    >
                      수정
                    </ButtonLink>
                    <DeleteProductButton
                      productName={product.name}
                      action={deleteProductAction.bind(null, product.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
