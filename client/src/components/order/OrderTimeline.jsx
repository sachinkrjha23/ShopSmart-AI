const STEPS = ['Processing', 'Shipped', 'Delivered']

const OrderTimeline = ({ status }) => {
  if (status === 'Cancelled') {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        Order Cancelled
      </div>
    )
  }

  const currentIndex = STEPS.indexOf(status)

  return (
    <div className="flex items-center">
      {STEPS.map((step, index) => {
        const isComplete = index <= currentIndex
        const isLast = index === STEPS.length - 1

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-3 w-3 rounded-full ${
                  isComplete ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              />
              <span
                className={`text-xs whitespace-nowrap ${
                  isComplete ? 'text-teal-600 font-medium' : 'text-gray-400'
                }`}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  index < currentIndex ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default OrderTimeline