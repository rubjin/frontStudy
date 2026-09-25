// '품절 상품 숨기기' 체크박스 (Step 2-3)
//
// 다른 필터들처럼 체크 여부는 부모(App)가 관리하는 제어 컴포넌트다.
// 텍스트 input은 value를 쓰지만, 체크박스는 checked로 상태를 연결한다.
//
// props
// - checked:  체크 여부 (true / false)
// - onChange: 체크가 바뀔 때 호출할 함수 (새 true / false를 넘겨준다)
function SoldOutToggle({ checked, onChange }) {
  return (
    // input을 label 안에 넣으면 htmlFor/id 없이도 둘이 연결된다. (암묵적 연결)
    // → 글자 부분을 눌러도 체크되므로 클릭 영역이 넓어진다. (모바일에서 특히 중요)
    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
      <input
        type="checkbox"
        checked={checked}
        // 체크박스는 e.target.value가 아니라 e.target.checked로 true/false를 읽는다
        onChange={(e) => onChange(e.target.checked)}
        // accent-color: 브라우저 기본 체크박스의 색만 바꾸는 CSS 속성.
        // 기본 체크박스를 그대로 쓰면 키보드·스크린리더 지원을 따로 만들 필요가 없다.
        className="h-4 w-4 accent-primary-600"
      />
      품절 상품 숨기기
    </label>
  )
}

export default SoldOutToggle
