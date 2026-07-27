const TableSkeleton = ({ rows = 6, columns = 5 }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {[...Array(columns)].map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-3 rounded w-16 skeleton-shimmer" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex} className="border-t border-gray-100">
              {[...Array(columns)].map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-4">
                  <div
                    className="h-3.5 rounded skeleton-shimmer"
                    style={{ width: `${60 + ((rowIndex + colIndex) % 3) * 15}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TableSkeleton