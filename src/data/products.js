// 상품 목 데이터 (Step 1)
//
// 목(mock) 데이터: 실제 서버 대신 쓰는 가짜 데이터.
// Step 1에서 컴포넌트 안에 있던 데이터를 이 파일로 분리했다.
// → 화면(컴포넌트)과 데이터를 나눠 두면, Step 5에서 API로 바꿀 때 이 파일만 교체하면 된다.
//
// 필드 설명
// - id:       상품 고유 번호 (목록 렌더링의 key로 사용)
// - name:     상품명
// - price:    가격. 계산·정렬을 위해 문자열이 아닌 '숫자'로 저장한다 (표시는 formatPrice)
// - category: 카테고리 (필터에 사용)
// - rating:   평점 (0~5)
// - stock:    재고 수량. 0이면 품절로 표시한다
export const products = [
  { id: 1,  name: '무선 노이즈캔슬링 헤드폰', price: 189000, category: '오디오',   rating: 4.6, stock: 12 },
  { id: 2,  name: '스마트워치 5세대',         price: 329000, category: '웨어러블', rating: 4.3, stock: 5  },
  { id: 3,  name: '휴대용 블루투스 스피커',   price: 79000,  category: '오디오',   rating: 4.1, stock: 0  },
  { id: 4,  name: '기계식 키보드 87키',       price: 149000, category: '주변기기', rating: 4.8, stock: 23 },
  { id: 5,  name: '버티컬 무선 마우스',       price: 59000,  category: '주변기기', rating: 4.0, stock: 8  },
  { id: 6,  name: '27인치 4K 모니터',         price: 459000, category: '디스플레이', rating: 4.5, stock: 3 },
  { id: 7,  name: 'USB-C 멀티 허브',          price: 45000,  category: '주변기기', rating: 3.9, stock: 41 },
  { id: 8,  name: '노트북 거치대 알루미늄',   price: 38000,  category: '액세서리', rating: 4.4, stock: 17 },
  { id: 9,  name: '오픈형 무선 이어폰',       price: 119000, category: '오디오',   rating: 4.2, stock: 0  },
  { id: 10, name: '웹캠 1080p 오토포커스',    price: 89000,  category: '주변기기', rating: 3.7, stock: 9  },
  { id: 11, name: '휴대용 SSD 1TB',           price: 139000, category: '저장장치', rating: 4.7, stock: 14 },
  { id: 12, name: '스마트 LED 조명바',        price: 52000,  category: '액세서리', rating: 4.0, stock: 6  },
]
