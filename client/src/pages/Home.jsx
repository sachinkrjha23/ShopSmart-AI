import HeroBanner from '../components/home/HeroBanner'
import CategoryGrid from '../components/home/CategoryGrid'
import AISearchBar from '../components/home/AISearchBar'
import FeaturedProducts from '../components/home/FeaturedProducts'
import TestimonialsSection from '../components/home/TestimonialsSection'

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroBanner />
      <CategoryGrid />
      <AISearchBar />
      <FeaturedProducts />
      <TestimonialsSection />
    </div>
  )
}

export default Home
