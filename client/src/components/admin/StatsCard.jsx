const StatsCard = ({ label, value, growth }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <div className="flex flex-col items-start gap-1">
        <p className="text-2xl font-bold text-gray-900 break-words">{value}</p>
        {growth && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              growth.startsWith('-') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}
          >
            {growth}
          </span>
        )}
      </div>
    </div>
  )
}

export default StatsCard