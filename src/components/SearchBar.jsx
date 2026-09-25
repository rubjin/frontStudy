import { Search } from './icons'

// 검색 입력창 (Step 1)
//
// 입력값을 스스로 저장하지 않고 부모(App)의 state를 value로 받아 보여 준다.
// 타이핑할 때마다 onChange로 새 값을 부모에게 알리고, 부모가 state를 바꾸면
// 새 value가 다시 내려와 화면에 반영된다. (제어 컴포넌트)
//
// props
// - value:    현재 검색어
// - onChange: 검색어가 바뀔 때 호출할 함수 (새 문자열을 넘겨준다)
function SearchBar({ value, onChange }) {
  return (
    <div className="relative max-w-xl mx-auto mb-10">
      {/* 돋보기 아이콘: absolute로 입력창 왼쪽 안에 겹쳐 놓는다 */}
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        <Search />
      </span>
      <input
        type="text"
        value={value}
        // e.target.value: 이벤트가 일어난 input의 현재 입력값
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products..."
        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 transition-all duration-200"
      />
    </div>
  )
}

export default SearchBar
