import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/ProductForm'
import { getCategories, getProduct } from '@/lib/products'
import { updateProductAction } from '../../actions'
import styles from '../../page.module.scss'

// 상품 수정 — 주소 "/admin/products/3/edit" (Step 8-3)
//
// 지금 상품 정보를 폼의 처음 값으로 넣고, 저장하면 updateProductAction(id, ...)이 실행된다.
// bind(null, product.id): 액션의 첫 인자(id)를 미리 채운 새 함수를 만든다 → 폼은 (state, formData)만 넘기면 된다

export const metadata: Metadata = { title: '상품 수정' }

export default async function EditProductPage({ params }: PageProps<'/admin/products/[id]/edit'>) {
  const { id } = await params
  const [product, categories] = await Promise.all([getProduct(id), getCategories()])
  if (!product) notFound()

  const { name, category, price, stock, rating } = product
  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>상품 수정</h1>
      </div>
      <ProductForm
        action={updateProductAction.bind(null, product.id)}
        categories={categories}
        defaultValues={{ name, category, price, stock, rating }}
        submitLabel="저장"
      />
    </>
  )
}
