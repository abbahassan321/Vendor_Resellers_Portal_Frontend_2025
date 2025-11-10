'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import toast, { Toaster } from 'react-hot-toast'
import api, { saveAuth } from '@/lib/api'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const toastId = toast.loading('Logging in as admin...')

    try {
      // 🔐 Call backend admin login
      const response = await api.adminLogin({ username, password })

      console.log('Admin login response:', response)

      // ✅ Extract token and user info
      const token = response?.token
      if (!token) {
        toast.error('❌ Invalid username or password', { id: toastId })
        setSubmitting(false)
        return
      }

      const admin = {
        id: response.identifier,
        username: response.username,
        role: response.role || 'ADMIN'
      }

      // ✅ Save token and login info
      saveAuth(token, admin)
      login(token, admin)

      toast.success(`🎉 Welcome back, ${admin.username}!`, {
        id: toastId,
        duration: 2000
      })

      // ✅ Redirect to dashboard after 2s
      setTimeout(() => router.push('/admin_dashboard'), 2000)
    } catch (err) {
      console.error('Admin login error:', err)
      const message =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string'
          ? err.response.data
          : 'An unexpected error occurred. Please try again.')
      toast.error('❌ ' + message, { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-24 bg-white p-6 rounded-lg shadow-md">
      <Toaster position="top-center" reverseOrder={false} />
      <h2 className="text-2xl font-semibold text-center mb-4">👑 Admin Login</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
    </div>
  )
}
