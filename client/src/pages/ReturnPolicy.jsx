import { Link } from 'react-router-dom'
import Breadcrumb from '../components/ui/Breadcrumb'

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </div>
)

const ReturnPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Return Policy' }]} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Return Policy</h1>
          <p className="text-xs text-gray-400 mb-8">Last updated: July 2026</p>

          <Section title="1. Eligibility">
            <p>Most items can be returned within 7 days of delivery if they're unused, in their original packaging, and in the same condition you received them. Some categories — such as perishable, personal care, or intimate items — may not be eligible for return for hygiene reasons.</p>
          </Section>

          <Section title="2. How to Request a Return">
            <p>Reach out to us via our <Link to="/contact" className="text-indigo-600 hover:underline">Contact page</Link> with your order ID and the reason for the return. Our support team will confirm eligibility and walk you through the next steps.</p>
          </Section>

          <Section title="3. Refunds">
            <p>Once a returned item is received and inspected, the refund is processed to your original payment method via Razorpay. Refunds typically reflect within 5-7 business days after approval.</p>
          </Section>

          <Section title="4. Damaged or Incorrect Items">
            <p>If you receive a damaged, defective, or incorrect item, contact us within 48 hours of delivery with photos of the item — we'll prioritize these cases for a replacement or full refund.</p>
          </Section>

          <Section title="5. Non-Returnable Situations">
            <p>Items marked as final sale, gift cards, and orders past the 7-day window are not eligible for return. If you're unsure whether your item qualifies, get in touch and we'll help clarify.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}

export default ReturnPolicy