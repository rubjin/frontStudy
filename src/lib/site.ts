// 사이트 전체에서 쓰는 기본 정보 (Step 3-1)
//
// 왜 따로 뺐나?
// - 사이트 이름과 '제목 | 사이트이름' 형식이 layout.tsx(title.template)와
//   error.tsx·global-error.tsx(<title> 태그)에 따로 적혀 있었다.
// - 사이트 이름이나 형식을 바꿀 때 한 곳만 고치면 되도록 여기에 모았다.
// - layout.tsx에서 직접 import하지 않는 이유: layout은 서버 컴포넌트이고 metadata 등 다른 것도 내보내므로,
//   클라이언트 컴포넌트(error.tsx)가 공통으로 가져다 쓰기에는 이런 작은 파일이 안전하다.

export const SITE_NAME = 'Shoppr'

// 페이지 제목 형식. layout의 title.template과 error 페이지의 <title>이 함께 쓴다.
// 예) formatTitle('문제가 발생했습니다') → '문제가 발생했습니다 | Shoppr'
export function formatTitle(title: string): string {
  return `${title} | ${SITE_NAME}`
}
