import Card from './Card'

const dummyData = [
  { id: 1, name: 'Wireless Headphones', price: '$129.99' },
  { id: 2, name: 'Smart Watch', price: '$199.99' },
  { id: 3, name: 'Bluetooth Speaker', price: '$79.99' },
  { id: 4, name: 'Mechanical Keyboard', price: '$149.99' },
]

function CardGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {dummyData.map((item) => (
        <Card key={item.id} name={item.name} price={item.price} />
      ))}
    </div>
  )
}

export default CardGrid
