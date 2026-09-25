// 정렬 기준 선택 드롭다운 (Step 2-2)
//
// CategoryFilter처럼 선택 값을 부모(App)가 관리하는 제어 컴포넌트다.
// 버튼 대신 <select>를 쓴 이유: 옵션이 여러 개 중 하나만 고르는 형태이고,
// 기본 select는 키보드·스크린리더 지원이 브라우저에 이미 들어 있다.
//
// props
// - options:  { value, label } 배열 (SORT_OPTIONS)
// - value:    현재 선택된 정렬 기준 value
// - onChange: 선택이 바뀔 때 호출할 함수 (새 value를 넘겨준다)
function SortSelect({ options, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {/* label의 htmlFor와 select의 id를 같게 맞추면 둘이 연결된다.
          → 스크린리더가 "정렬, 콤보 상자"처럼 읽고, 라벨을 눌러도 select에 포커스가 간다.
          JSX에서는 for가 자바스크립트 예약어라서 htmlFor라고 쓴다. */}
      <label htmlFor="sort" className="text-sm text-gray-500 dark:text-gray-400">
        정렬
      </label>
      <select
        id="sort"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default SortSelect
