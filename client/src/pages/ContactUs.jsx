import { useState } from 'react'
import { toast } from 'react-hot-toast'
import Breadcrumb from '../components/ui/Breadcrumb'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { sendContactMessage } from '../api/contactApi'

const EMPTY_FORM = { name: '', email: '', subject: '', message: '' }

const ContactUs = () => {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await sendContactMessage(formData)
      toast.success(res.data.message)
      setFormData(EMPTY_FORM)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Contact Us' }]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Get in Touch</h1>
            <p className="text-gray-500 text-sm mb-8">
              Have a question about an order, a product, or anything else? Send us a message
              and we'll get back to you as soon as we can.
            </p>

            <div className="flex flex-col gap-5 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Email</p>
                <p className="text-gray-700">support@shopsmart.ai</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Phone</p>
                <p className="text-gray-700">+91 98765 43210</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Address</p>
                <p className="text-gray-700">123 Commerce Street, Durgapur, West Bengal, India</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Support Hours</p>
                <p className="text-gray-700">Mon–Sat, 10 AM – 6 PM IST</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                />
                <Input
                  label="Your Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                />
              </div>
              <Input
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                disabled={submitting}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  maxLength={2000}
                  disabled={submitting}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200 resize-none"
                />
              </div>
              <Button type="submit" disabled={submitting} className="self-start">
                {submitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactUs