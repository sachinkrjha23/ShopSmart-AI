import { useState } from 'react'
import Breadcrumb from '../components/ui/Breadcrumb'

const FAQ_SECTIONS = [
  {
    category: 'Orders & Shipping',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Most orders are processed within 1-2 business days and shipped from our partner warehouses. Delivery timelines depend on your location and are shown at checkout before you pay.',
      },
      {
        q: 'Do I get free shipping?',
        a: 'Yes — orders above a minimum cart value qualify for free shipping automatically. The exact threshold and any shipping fee below it are always shown in your cart before checkout, so there are no surprises.',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes. Go to "My Orders" from your account to see real-time status — Processing, Shipped, or Delivered — along with the items and delivery address for each order.',
      },
    ],
  },
  {
    category: 'Payments & Refunds',
    items: [
      {
        q: 'What payment methods are accepted?',
        a: 'We use Razorpay for all payments, which supports credit/debit cards, UPI, net banking, and popular wallets — all processed securely, we never store your card details.',
      },
      {
        q: 'My payment failed but money was deducted. What now?',
        a: 'This is usually a temporary hold, not an actual charge, and it\'s automatically reversed by your bank within 5-7 business days. If an order was genuinely not created on our end, no charge is finalized on our side.',
      },
      {
        q: 'How do refunds work if I cancel an order?',
        a: 'If you cancel an order that\'s already been paid for, the refund is initiated automatically through Razorpay to your original payment method, typically reflecting within 5-7 business days.',
      },
    ],
  },
  {
    category: 'Cancellations & Returns',
    items: [
      {
        q: 'Can I cancel an order after placing it?',
        a: 'Yes, as long as it hasn\'t been shipped yet. Once an order moves to "Shipped" status, it can no longer be cancelled from your account — reach out to support instead.',
      },
      {
        q: 'What\'s your return policy?',
        a: 'See our full Return Policy page for details on eligibility, timelines, and how refunds are processed for returned items.',
      },
    ],
  },
  {
    category: 'Coupons & Discounts',
    items: [
      {
        q: 'Why did my coupon get rejected at checkout?',
        a: 'Coupons can be limited by minimum order amount, an expiry date, or a maximum number of uses (either overall or per customer). The exact reason is always shown when a coupon doesn\'t apply.',
      },
      {
        q: 'Can I use more than one coupon on an order?',
        a: 'Only one coupon can be applied per order at this time.',
      },
    ],
  },
  {
    category: 'Account',
    items: [
      {
        q: 'Do I need an account to shop?',
        a: 'You can browse and search freely without one, but adding items to your cart and checking out requires a free account — this keeps your order history and saved addresses in one place.',
      },
      {
        q: 'Can I sign up with Google?',
        a: 'Yes — Google Sign-In is available for both new accounts and logging into an existing one, no separate password needed.',
      },
      {
        q: 'I didn\'t get my verification email. What do I do?',
        a: 'Check your spam folder first. If it\'s not there, you can request the verification link to be resent from the login screen.',
      },
    ],
  },
]

const FAQItem = ({ q, a, isOpen, onToggle }) => (
  <div className="border-b border-gray-100 last:border-0">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 py-4 text-left"
    >
      <span className="text-sm font-medium text-gray-800">{q}</span>
      <span
        className={`shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
      >
        +
      </span>
    </button>
    {isOpen && (
      <p className="text-sm text-gray-600 leading-relaxed pb-4 pr-8">{a}</p>
    )}
  </div>
)

const FAQ = () => {
  const [openKey, setOpenKey] = useState(null)

  const toggle = (key) => {
    setOpenKey((prev) => (prev === key ? null : key))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'FAQ' }]} />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-500 mb-8">
          Everything you need to know about shopping with ShopSmart AI.
        </p>

        <div className="flex flex-col gap-6">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.category} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                {section.category}
              </h2>
              {section.items.map((item, index) => {
                const key = `${section.category}-${index}`
                return (
                  <FAQItem
                    key={key}
                    q={item.q}
                    a={item.a}
                    isOpen={openKey === key}
                    onToggle={() => toggle(key)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FAQ