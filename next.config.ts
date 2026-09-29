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
}

export default nextConfig
