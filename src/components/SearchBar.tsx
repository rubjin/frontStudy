import { Search } from './icons'
import styles from './SearchBar.module.scss'

// 검색 입력창 (Step 1)
//
// 입력값을 스스로 저장하지 않고 부모(App)의 state를 value로 받아 보여 준다.
// 타이핑할 때마다 onChange로 새 값을 부모에게 알리고, 부모가 state를 바꾸면
// 새 value가 다시 내려와 화면에 반영된다. (제어 컴포넌트)
//
// props
// - value:    현재 검색어
// - onChange: 검색어가 바뀔 때 호출할 함수 (새 문자열을 넘겨준다)
interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className={styles.wrap}>
      {/* 돋보기 아이콘: absolute로 입력창 왼쪽 안에 겹쳐 놓는다 */}
      <span className={styles.icon}>
        <Search />
      </span>
      <input
        type="text"
        value={value}
        // e.target.value: 이벤트가 일어난 input의 현재 입력값
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products..."
        // aria-label: 눈에 보이는 <label>이 없는 입력창에 스크린리더용 이름을 준다 (Step 3-2에서 추가)
        // placeholder는 입력을 시작하면 사라지고, 스크린리더가 이름으로 읽지 않을 수 있어서 이름 대신 쓰면 안 된다
        aria-label="상품 검색"
        className={styles.input}
      />
    </div>
  )
}

export default SearchBar
