const StarRating = ({ rating = 0, maxStars = 5, size = 'md', interactive = false, onChange }) => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  return (
    <div className={`flex items-center gap-0.5 ${sizes[size]}`}>
      {[...Array(maxStars)].map((_, i) => (
        <span
          key={i}
          onClick={() => interactive && onChange && onChange(i + 1)}
          className={`${interactive ? 'cursor-pointer' : ''} ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default StarRating