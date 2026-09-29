import type { ComponentProps } from 'react'
import Link from 'next/link'

// 공통 버튼 컴포넌트 — Button(<button>)과 ButtonLink(<a>) (Step 3-1)
//
// 왜 컴포넌트로 만드나?
// - 버튼 모양(색·여백·둥글기·포커스 표시)을 화면마다 클래스로 복사하면, 디자인이 바뀔 때 전부 찾아 고쳐야 한다.
// - 컴포넌트로 만들면 <Button variant="primary">처럼 '어떤 종류의 버튼인지'만 고르면 된다.
//   → 디자인 시스템의 첫 부품. 퍼블리셔 관점: 버튼 가이드(.btn, .btn-primary, .btn-sm)를 컴포넌트로 옮긴 것.
//
// 왜 두 개로 나누나? (Button vs ButtonLink)
// - 모양이 같아도 '하는 일'에 따라 태그가 달라야 한다. (시맨틱 마크업, 접근성)
//   · 페이지를 이동한다          → <a href>     = ButtonLink  예) 홈으로 가기
//   · 현재 화면에서 무언가 실행한다 → <button>    = Button      예) 다시 시도, 다크 모드 전환
// - <button onClick={() => router.push('/')}>로 이동을 흉내 내면
//   새 탭 열기(가운데 클릭), 링크 주소 복사가 안 되고, 스크린리더도 '링크'가 아니라 '버튼'으로 읽는다.
//
// components/ui/ 폴더: 버튼처럼 '특정 기능(상품, 장바구니...)과 상관없는 기본 부품'을 모아 둔다.
// Card, CategoryFilter 같은 '쇼핑몰 전용 부품'은 components/ 바로 아래에 둔다.

// variant: 버튼의 역할(중요도)에 따른 모양
// - primary:   화면에서 가장 중요한 행동 하나 (파란 배경)
// - secondary: 보조 행동 (테두리만)
// - ghost:     배경 없이 hover 때만 배경이 생김 (아이콘 버튼, 툴바)
type ButtonVariant = 'primary' | 'secondary' | 'ghost'
// size: md(기본), icon(아이콘만 있는 정사각형 버튼)
type ButtonSize = 'md' | 'icon'

// 모양 관련 props. Button과 ButtonLink가 함께 쓴다.
interface ButtonStyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
}

// variant·size별 클래스 표
// 객체로 만들어 두면 variant를 추가할 때 여기 한 줄만 늘리면 된다. (sortProducts의 COMPARATORS와 같은 방식)
// Record<ButtonVariant, string>: 모든 variant에 대한 값이 꼭 있어야 한다 → 하나를 빼먹으면 타입 에러
// Step 3-2에서 Button.module.scss로 옮긴다.
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary:
    'border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
  ghost: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
}

const SIZES: Record<ButtonSize, string> = {
  md: 'px-4 py-2',
  icon: 'p-2',
}

// 클래스 문자열을 조립한다. className: 쓰는 쪽에서 여백 등을 조금 더 붙이고 싶을 때
// filter(Boolean): className이 undefined이면 빼고 합친다
function buttonClassName({ variant = 'primary', size = 'md' }: ButtonStyleProps, className?: string) {
  return [BASE, VARIANTS[variant], SIZES[size], className].filter(Boolean).join(' ')
}

// ComponentProps<'button'>: <button>이 받을 수 있는 모든 속성(onClick, disabled, aria-label...)의 타입
// & ButtonStyleProps: 거기에 variant, size를 더한다
// → <Button onClick={...} disabled aria-label="...">처럼 일반 button 속성을 그대로 쓸 수 있다.
type ButtonProps = ComponentProps<'button'> & ButtonStyleProps

// ...rest: 위에서 꺼낸 것 말고 나머지 props를 모두 모은다 (나머지 매개변수)
// {...rest}: 모은 props를 <button>에 그대로 펼쳐 넣는다 (전개 연산자)
export function Button({ variant, size, className, type = 'button', ...rest }: ButtonProps) {
  // type 기본값을 'button'으로: <button>의 원래 기본값은 'submit'이라,
  // form 안에 두면 의도치 않게 폼이 제출된다. 제출 버튼이 필요하면 type="submit"을 넘긴다.
  return <button type={type} className={buttonClassName({ variant, size }, className)} {...rest} />
}

// ComponentProps<typeof Link>: next/link의 Link가 받는 모든 속성(href, prefetch...)의 타입
type ButtonLinkProps = ComponentProps<typeof Link> & ButtonStyleProps

export function ButtonLink({ variant, size, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClassName({ variant, size }, className)} {...rest} />
}
