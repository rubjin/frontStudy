// 카테고리 버튼 목록 (Step 2)
//
// 이 컴포넌트는 '어떤 카테고리가 선택됐는지'를 스스로 기억하지 않는다.
// 선택 값(value)은 부모(App)가 가지고 있고, 버튼을 누르면 onChange로 부모에게 알린다.
// 이런 방식을 '제어 컴포넌트(controlled component)'라고 한다.
// → 상태가 한 곳(App)에만 있으니 검색·필터·정렬을 함께 계산하기 쉽다.
//
// props
// - categories: 버튼으로 보여 줄 카테고리 이름 배열
// - value:      현재 선택된 카테고리
// - onChange:   버튼을 눌렀을 때 호출할 함수 (선택한 카테고리 이름을 넘겨준다)
//
// ※ Step 2-2: 정렬 드롭다운과 한 줄에 놓기 위해 바깥 여백(mb-6)은 App의 툴바가 맡도록 뺐다.
//   컴포넌트 자체에는 바깥 여백을 두지 않고, 배치하는 쪽(부모)이 간격을 정하는 게 재사용에 유리하다.
function CategoryFilter({ categories, value, onChange }) {
  return (
    // role="group" + aria-label: 스크린리더가 "카테고리 필터 그룹"이라고 읽어 준다
    <div role="group" aria-label="카테고리 필터" className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const selected = category === value
        return (
          <button
            // key: React가 목록의 각 항목을 구분하는 이름표. 목록에서 유일한 값이어야 한다
            key={category}
            // form 안에 들어가도 submit 되지 않도록 type을 명시하는 습관
            type="button"
            // aria-pressed: 토글 버튼이 눌린 상태인지 스크린리더에 알려 준다 (접근성)
            aria-pressed={selected}
            onClick={() => onChange(category)}
            // 선택 여부에 따라 클래스를 바꾼다 (템플릿 문자열 + 삼항 연산자)
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
              selected
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryFilter
