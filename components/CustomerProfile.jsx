'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import api, { getUser } from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'

export default function CustomerProfile() {
  const [user, setUser] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)

  // Load logged-in user
  useEffect(() => {
    const u = getUser()
    if (!u) {
      toast.error('⚠️ You must log in first.')
      setTimeout(() => (window.location.href = '/login'), 2000)
      return
    }
    setUser(u)
  }, [])

  // Fetcher for customer details
  const fetchCustomer = async () => {
    if (!user?.msisdn) throw new Error('Missing customer MSISDN.')
    return await api.getCustomerByMsisdn(user.msisdn)
  }

  const { data: customerData, error, isLoading, mutate } = useSWR(
    user?.msisdn ? ['customer-profile', user.msisdn] : null,
    fetchCustomer,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  )

  // Fetch wallet balance separately and auto-refresh every 10s
  const { data: walletData } = useSWR(
    user?.email ? ['wallet-balance', user.email] : null,
    async () => {
      const res = await api.getWalletBalance(user.email, user.role || 'CUSTOMER')
      return res?.balance || 0
    },
    { refreshInterval: 10000 }
  )

  const walletBalance = walletData || 0

  useEffect(() => {
    if (customerData) {
      setForm({
        fullName: customerData.fullName || '',
        email: customerData.email || '',
        password: '',
      })
    }
  }, [customerData])

  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0)
    if (num >= 1_000_000_000) return `₦${(num / 1_000_000_000).toFixed(2)}B`
    if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(2)}M`
    if (num >= 1_000) return `₦${(num / 1_000).toFixed(2)}K`
    return `₦${num.toFixed(2)}`
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!form.fullName || !form.email) {
      toast.error('❌ Name and email are required.')
      return
    }

    setSaving(true)
    try {
      const payload = { fullName: form.fullName, email: form.email }
      if (form.password) payload.password = form.password

      await api.updateCustomerProfile(user.msisdn, payload)
      toast.success('✅ Profile updated successfully!')
      setEditMode(false)
      mutate() // refresh customer info
    } catch (err) {
      console.error('Failed to update profile:', err)
      toast.error(`❌ Failed to update: ${err?.message || err}`)
    } finally {
      setSaving(false)
    }
  }

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Loading session...
      </div>
    )

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Fetching your profile...
      </div>
    )

  if (error) {
    console.error('❌ Failed to load profile:', error)
    toast.error('❌ Failed to load profile.')
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <p>Something went wrong while loading your profile.</p>
      </div>
    )
  }

  const customer = customerData || {}

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          👤 Customer Profile
        </h1>

        {/* Profile Info */}
        <div className="space-y-3 mb-6">
          <ProfileRow label="Full Name" value={customer.fullName} />
          <ProfileRow label="Email" value={customer.email} />
          <ProfileRow label="Phone (MSISDN)" value={customer.msisdn} />
          <ProfileRow label="Wallet Balance" value={formatCurrency(walletBalance)} />
          <ProfileRow label="Status" value={customer.status || 'ACTIVE'} />
          <ProfileRow
            label="Registered"
            value={
              customer.createdAt ? new Date(customer.createdAt).toLocaleString() : '—'
            }
          />
        </div>

        {/* Edit Profile */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Edit Profile</h2>
            <button
              onClick={() => setEditMode((prev) => !prev)}
              className="text-sm text-blue-600 hover:underline"
            >
              {editMode ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editMode && (
            <div className="space-y-4">
              <InputRow label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} />
              <InputRow label="Email" name="email" value={form.email} onChange={handleChange} />
              <InputRow label="Password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" type="password" />

              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => mutate()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}

/* Profile Row */
function ProfileRow({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-100 py-2">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="text-gray-800">{value || '—'}</span>
    </div>
  )
}

/* Input Row */
function InputRow({ label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="flex flex-col">
      <label className="text-gray-500 font-medium mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder || ''}
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  )
}
