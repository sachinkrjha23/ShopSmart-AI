import { Link } from 'react-router-dom'
import Breadcrumb from '../components/ui/Breadcrumb'

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'About Us' }]} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-12">
          <span className="text-xs font-medium text-teal-500 uppercase tracking-wide">
            Our Story
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-4">
            About ShopSmart AI
          </h1>
          <p className="text-gray-600 leading-relaxed mb-6">
            ShopSmart AI started with a simple idea: online shopping should feel
            personal, not overwhelming. Instead of scrolling through endless
            listings hoping to stumble onto the right product, we built a store
            that actually helps you find it — using AI to understand what you're
            looking for and surface products that genuinely fit.
          </p>
          <p className="text-gray-600 leading-relaxed mb-10">
            From curated categories to secure, seamless checkout, every part of
            ShopSmart AI is designed around one goal: making sure you spend less
            time searching and more time enjoying what you bought.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="text-center p-6 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold text-teal-600 mb-1">AI-Powered</p>
              <p className="text-sm text-gray-500">Smart product recommendations tailored to you</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold text-teal-600 mb-1">Secure Payments</p>
              <p className="text-sm text-gray-500">Checkout powered by Razorpay, every time</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold text-teal-600 mb-1">Real Support</p>
              <p className="text-sm text-gray-500">A team that actually reads your messages</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-3">What We Believe</h2>
          <ul className="text-gray-600 leading-relaxed space-y-2 mb-10 list-disc list-inside">
            <li>Shopping should be fast, honest, and free of dark patterns.</li>
            <li>Recommendations should help you, not just push whatever sells the most.</li>
            <li>Prices should be clear — what you see is what you pay, taxes and shipping included.</li>
          </ul>

          <div className="bg-teal-50 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-700 font-medium">Ready to find something you'll actually love?</p>
            <Link
              to="/products"
              className="bg-teal-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About