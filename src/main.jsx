import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.jsx'
import './index.css'

// BrowserRouter (Step 3-1)
// 앱 전체를 감싸서 "지금 주소(URL)가 무엇인지"를 모든 컴포넌트가 알 수 있게 해 준다.
// 이 안에 있어야 Routes, Link, useParams 같은 라우터 기능을 쓸 수 있다.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
