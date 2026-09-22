import { Search } from './icons'

function SearchBar({ value, onChange }) {
  return (
    <div className="relative max-w-xl mx-auto mb-10">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        <Search />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products..."
        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 transition-all duration-200"
      />
    </div>
  )
}

export default SearchBar
