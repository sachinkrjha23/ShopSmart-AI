import Breadcrumb from '../components/ui/Breadcrumb'

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </div>
)

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Terms & Conditions' }]} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Terms & Conditions</h1>
          <p className="text-xs text-gray-400 mb-8">Last updated: July 2026</p>

          <Section title="1. Account Registration">
            <p>You must be able to receive email at the address you register with, since we verify every account via email link before it becomes active (Google sign-ins are verified by Google directly). You're responsible for keeping your login credentials secure.</p>
          </Section>

          <Section title="2. Orders & Pricing">
            <p>All prices are listed in Indian Rupees (₹) and include any applicable taxes shown at checkout — the total you see before paying is the total you pay, no hidden charges added afterward.</p>
            <p>Placing an order is an offer to purchase; we reserve the right to cancel an order (with a full refund) if a product turns out to be unavailable or mispriced due to an error.</p>
          </Section>

          <Section title="3. Payments">
            <p>All payments are processed securely through Razorpay. We do not store your card, UPI, or banking details on our servers at any point.</p>
          </Section>

          <Section title="4. Cancellations">
            <p>You may cancel an order yourself from your account as long as it hasn't been marked "Shipped" yet. Once shipped, an order can no longer be self-cancelled — contact us if there's an issue.</p>
            <p>If a paid order is cancelled, a refund is automatically initiated through Razorpay to your original payment method.</p>
          </Section>

          <Section title="5. Coupons & Promotions">
            <p>Coupon codes are subject to their individual terms — minimum order value, expiry date, and usage limits — all of which are shown clearly if a coupon doesn't apply. Only one coupon may be used per order. We reserve the right to modify or discontinue any coupon or promotion at any time.</p>
          </Section>

          <Section title="6. Product Reviews">
            <p>Only customers who have purchased and received a product may leave a review for it. Reviews should reflect genuine experiences; we reserve the right to remove reviews that are abusive, fraudulent, or violate these terms.</p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>ShopSmart AI is provided "as is." While we take reasonable care to keep listings, pricing, and stock accurate, we're not liable for indirect or incidental damages arising from use of the site, to the fullest extent permitted by law.</p>
          </Section>

          <Section title="8. Changes to These Terms">
            <p>We may revise these terms from time to time. Continued use of the site after changes are posted constitutes acceptance of the revised terms.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions