import type { CSSProperties } from 'react'
import clsx from 'clsx'
import styles from './Skeleton.module.scss'

// 스켈레톤 — 내용이 오기 전에 보여 주는 회색 자리 표시 조각 (Step 3-2 보강)
//
// 왜 필요한가?
// - 데이터를 기다리는 동안 빈 화면이나 '로딩 중...' 글자만 보이면 사용자는 얼마나 기다려야 할지, 무엇이 나올지 모른다.
// - 최종 화면과 같은 '모양'을 먼저 보여 주면 더 빨리 뜨는 것처럼 느껴지고(체감 속도),
//   내용이 들어올 때 레이아웃이 움직이지 않는다. (크기를 똑같이 맞췄을 때)
//
// 이 컴포넌트는 '조각 하나'만 담당한다. 카드·목록 모양 조립은 CardSkeleton, CatalogSkeleton이 한다.
// (Button처럼 기능과 무관한 기본 부품이라 components/ui/에 둔다)
//
// props
// - width:  너비 (예: '60%', toRem(64)). 없으면 부모 너비를 따르거나(block) 1em(inline)
// - height: 높이 (예: toRem(32)). 없으면 글자 한 줄 높이에 맞춘 기본값
//   px 값은 lib/units.ts의 toRem(시안 px)으로 넘긴다
// - block:  true면 한 줄 전체를 차지하는 상자(이미지 자리 등), false면 글자처럼 줄 안에 들어가는 조각
// - radius: 둥글기. 'md'(기본) | 'lg' | 'full'(알약 모양)
// - className: 크기를 SCSS로 정하고 싶을 때
//
// 접근성: 조각 하나하나는 스크린리더가 읽을 내용이 없으므로 aria-hidden으로 숨긴다.
// 대신 스켈레톤을 모아 놓은 쪽(CatalogSkeleton)에서 role="status"로 "불러오는 중"이라고 한 번만 알린다.
interface SkeletonProps {
  width?: string
  height?: string
  block?: boolean
  radius?: 'md' | 'lg' | 'full'
  className?: string
}

export function Skeleton({ width, height, block = false, radius = 'md', className }: SkeletonProps) {
  // style: 값이 매번 달라지는 크기만 인라인으로 넘긴다. (색·애니메이션 같은 고정 모양은 SCSS에)
  const style: CSSProperties = { width, height }

  return (
    <span
      aria-hidden="true"
      className={clsx(styles.skeleton, block ? styles.block : styles.inline, styles[radius], className)}
      style={style}
    />
  )
}
