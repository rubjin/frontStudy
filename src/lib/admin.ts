import 'server-only'

// 관리 화면을 열어도 되는지 (Step 8-3, 임시)
//
// 아직 로그인 기능이 없다(Step 9). 관리 화면이 아무에게나 열리면 누구나 상품을 지울 수 있다.
// 그래서 Step 9 전까지는
// - 개발 모드(npm run dev): 열림
// - 배포 빌드(next start): 환경 변수 ADMIN_ENABLED=1 일 때만 열림 (검증용)
// Step 9에서 '관리자로 로그인했는지' 검사로 바꾼다.
//
// ⚠️ 페이지만 막으면 안 된다. Server Action은 페이지와 별개로 호출할 수 있는 '서버 주소'라서
//    actions.ts의 각 함수 안에서도 다시 검사한다. (화면 숨기기 ≠ 권한 검사)
export function isAdminEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ADMIN_ENABLED === '1'
}
