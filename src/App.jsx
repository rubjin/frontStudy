import { useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import CardGrid from './components/CardGrid'

function App() {
  const [dark, setDark] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">
        <Header dark={dark} onToggle={() => setDark((d) => !d)} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SearchBar value={query} onChange={setQuery} />
          <CardGrid />
        </main>
      </div>
    </div>
  )
}

export default App
