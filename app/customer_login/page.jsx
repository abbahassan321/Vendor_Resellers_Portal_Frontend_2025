'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import toast, { Toaster } from 'react-hot-toast'
import api, { saveAuth } from '@/lib/api'

export default function CustomerLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const toastId = toast.loading('Logging in...')

    try {
      const response = await api.customerLogin({ email: email.trim(), password })
      const data = response?.data || response
      console.log('Customer login response:', data)

      if (data?.status === 'success' && data?.token && data?.customer) {
        const { token, customer } = data
        const userEmail = customer.email || email

        const userObj = {
          id: customer.id,
          email: userEmail,
          fullName: customer.fullName,
          role: 'CUSTOMER',
        }

        // Save consistent identifier and role
        saveAuth(token, { identifier: userEmail, role: 'CUSTOMER' })
        localStorage.setItem('glovendor_identifier', userEmail)
        localStorage.setItem('glovendor_role', 'CUSTOMER')
        localStorage.setItem('user', JSON.stringify(userObj))

        login(token, userObj)

        toast.success(`🎉 Welcome back, ${customer.fullName || userEmail}!`, { id: toastId, duration: 2500 })
        setTimeout(() => router.push('/customer_dashboard'), 1500)
      } else {
        toast.error(data?.message || '❌ Invalid email or password', { id: toastId })
      }
    } catch (err) {
      console.error('Login error:', err)
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'An unexpected error occurred. Please try again.'
      toast.error('❌ ' + message, { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow">
      <Toaster position="top-center" reverseOrder={false} />
      <h2 className="text-xl font-semibold mb-4 text-center">👤 Customer Login</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-3 text-sm text-center">
        Don’t have an account?{' '}
        <a href="/customer_signup" className="text-blue-600 hover:underline">
          Sign up
        </a>
      </p>
    </div>
  )
}
