import Breadcrumb from '../components/ui/Breadcrumb'

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </div>
)

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
          <p className="text-xs text-gray-400 mb-8">Last updated: July 2026</p>

          <Section title="1. What We Collect">
            <p>When you create an account, we collect your name, email address, and password (stored securely, never in plain text). If you sign up with Google, we receive your name, email, and profile picture from Google instead.</p>
            <p>When you place an order, we collect the shipping address, phone number, and order details needed to deliver it. Payment is processed entirely by Razorpay — we never see or store your card, UPI, or bank details.</p>
            <p>If you upload a profile picture, it's stored via Cloudinary. If you leave a product review, your name and review content are visible to other shoppers.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use your data to process orders, send order and account-related emails (verification, password resets, shipping updates), personalize AI-powered product recommendations, and improve the store based on how it's used.</p>
            <p>We do not sell your personal information to third parties.</p>
          </Section>

          <Section title="3. Cookies">
            <p>We use a single essential cookie to keep you logged in securely (an httpOnly authentication token). This cookie can't be read by JavaScript and is only used to verify your session — we don't use tracking or advertising cookies.</p>
          </Section>

          <Section title="4. Third-Party Services">
            <p>We share the minimum necessary data with trusted providers to operate the store: Razorpay (payments), Cloudinary (image hosting), Google (sign-in, if you choose to use it), and our email provider (transactional emails only — verification links, receipts, order updates).</p>
          </Section>

          <Section title="5. Data Retention & Account Deletion">
            <p>You can delete your account at any time from your profile. When you do, your personal details are anonymized rather than instantly erased — this keeps order records and revenue history accurate for legal and accounting purposes, while removing your name, email, and any identifying information from your account.</p>
          </Section>

          <Section title="6. Your Rights">
            <p>You can view and update your profile information, download nothing is stored beyond what's shown in your account, and request account deletion at any time. If you have questions about your data, reach out via our Contact page.</p>
          </Section>

          <Section title="7. Changes to This Policy">
            <p>We may update this policy occasionally to reflect changes in how the store operates. Continued use of ShopSmart AI after changes means you accept the updated policy.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy