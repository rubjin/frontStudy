import type { Metadata } from 'next'
import { ProductForm } from '@/components/ProductForm'
import { getCategories } from '@/lib/products'
import { createProductAction } from '../actions'
import styles from '../page.module.scss'

// 상품 추가 — 주소 "/admin/products/new" (Step 8-3)

export const metadata: Metadata = { title: '상품 추가' }

export default async function NewProductPage() {
  const categories = await getCategories()
  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>상품 추가</h1>
      </div>
      {/* 새 상품의 기본값: 평점 0, 재고 0 */}
      <ProductForm
        action={createProductAction}
        categories={categories}
        defaultValues={{ rating: 0, stock: 0 }}
        submitLabel="추가"
      />
    </>
  )
}
