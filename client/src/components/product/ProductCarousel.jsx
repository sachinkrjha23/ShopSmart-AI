import { useRef, useEffect, useCallback } from 'react'
import ProductCard from './ProductCard'

const ProductCarousel = ({ products, loading }) => {
  const scrollRef = useRef(null)
  const pausedRef = useRef(false)
  const resumeTimeoutRef = useRef(null)

  const pauseAutoScroll = useCallback(() => {
    pausedRef.current = true
    clearTimeout(resumeTimeoutRef.current)
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false
    }, 3000) // resume auto-scroll 3s after the user stops interacting
  }, [])

  useEffect(() => {
    const container = scrollRef.current
    if (!container || loading || !products?.length) return

    const interval = setInterval(() => {
      if (pausedRef.current) return
      const cardWidth = container.firstChild?.offsetWidth || 260
      const atEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 10

      container.scrollTo({
        left: atEnd ? 0 : container.scrollLeft + cardWidth + 16,
        behavior: 'smooth',
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [loading, products])

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto sm:hidden -mx-4 px-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-[70vw] shrink-0 bg-white rounded-xl border border-gray-100 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-t-xl" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      onTouchStart={pauseAutoScroll}
      onMouseDown={pauseAutoScroll}
      className="flex gap-4 overflow-x-auto sm:hidden -mx-4 px-4 pb-2 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {products.map((product) => (
        <div key={product.id} className="w-[70vw] shrink-0 snap-start">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}

export default ProductCarousel