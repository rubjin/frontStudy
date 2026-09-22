function Card({ name, price }) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900 transition-all duration-300 cursor-pointer">
      <div className="aspect-square mb-4 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
        <span className="text-4xl text-primary-500 dark:text-primary-400 font-bold opacity-50">
          {name.charAt(0)}
        </span>
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {name}
      </h3>
      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
        {price}
      </p>
    </div>
  )
}

export default Card
