import path from 'node:path'
import type { NextConfig } from 'next'

// Next.js 설정 파일 (Step 3-1)
const nextConfig: NextConfig = {
  // Sass 설정 (Step 3-2)
  // loadPaths: @use로 파일을 찾을 때 '기본으로 뒤져 볼 폴더'
  // → src를 등록해 두면 어느 폴더의 .module.scss에서든 @use 'styles' as *; 한 줄로 토큰·mixin을 불러온다.
  //   (없으면 '../../styles'처럼 파일 위치마다 ../ 개수를 세야 한다)
  // ※ TypeScript의 '@/' 별칭은 Sass 안에서 제대로 동작하지 않아서 이 방법을 쓴다.
  //   ('@/styles'는 찾지만, 그 파일 안의 @forward 'tokens' 같은 상대 경로를 못 찾는다)
  sassOptions: {
    loadPaths: [path.join(process.cwd(), 'src')],
  },

  // 이미지 최적화 설정 (Step 3-2 보강)
  images: {
    // localPatterns: next/image가 최적화해 줄 '내 사이트 안의 경로'를 제한한다.
    // 지정한 경로 밖의 이미지를 최적화하라는 요청은 거부(400)해서, 서버 자원을 악용하는 요청을 막는다.
    // search: '' → 주소 뒤에 ?query가 붙은 요청도 거부
    localPatterns: [{ pathname: '/images/**', search: '' }],
  },
}

export default nextConfig
