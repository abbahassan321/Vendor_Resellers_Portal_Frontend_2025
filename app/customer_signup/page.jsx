'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import api, { saveAuth } from '@/lib/api'

export default function CustomerSignup() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    msisdn: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const toastId = toast.loading('Creating your account...')

    try {
      const data = await api.createCustomer({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        msisdn: form.msisdn.trim(),
        password: form.password,
      })

      console.log('Signup response:', data)

      if (data?.status === 'success' || data?.message?.includes('created')) {
        toast.success('🎉 Account created successfully! Redirecting to login...', {
          id: toastId,
          duration: 2500,
        })

        // Optional: Auto-login after signup
        const loginData = await api.customerLogin({
          email: form.email.trim(),
          password: form.password,
        })

        const token = loginData?.data?.token || loginData?.token
        const customer = loginData?.data?.customer || loginData?.customer

        if (token && customer?.email) {
          // Save consistent identifier and role
          saveAuth(token, { identifier: customer.email, role: 'CUSTOMER' })
          localStorage.setItem('glovendor_identifier', customer.email)
          localStorage.setItem('glovendor_role', 'CUSTOMER')
          localStorage.setItem(
            'user',
            JSON.stringify({ id: customer.id, email: customer.email, fullName: customer.fullName, role: 'CUSTOMER' })
          )
        }

        setTimeout(() => router.push('/customer_dashboard'), 2500)
      } else {
        toast.error(data?.message || '❌ Registration failed. Please try again.', { id: toastId })
      }
    } catch (err) {
      console.error('Signup error:', err)
      const message =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : 'An unexpected error occurred.')
      toast.error('❌ ' + message, { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow">
      <Toaster position="top-center" reverseOrder={false} />
      <h2 className="text-xl font-semibold mb-4 text-center">📝 Customer Signup</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          name="msisdn"
          placeholder="Phone (11 digits)"
          value={form.msisdn}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          pattern="\d{11}"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-2 text-white rounded transition ${
            submitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {submitting ? 'Creating...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-3 text-sm text-center">
        Already have an account?{' '}
        <a href="/customer_login" className="text-blue-600 hover:underline">
          Login
        </a>
      </p>
    </div>
  )
}
