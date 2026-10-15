//px -> rem 변환 (입력: 여러 number -> 반환 : string) 

//기준 글자 크기. SCSS와 통일
export const ROOT_FONT_SIZE = 16

//toRem(12, 16) -> px = [12, 16] 함수호출 시 나머지 매개변수로 배열생성

export function toRem(...px: number[]): string {
    return px.map((value) => (value === 0 ? '0' : `${value / ROOT_FONT_SIZE}rem`)).join(' ')
}