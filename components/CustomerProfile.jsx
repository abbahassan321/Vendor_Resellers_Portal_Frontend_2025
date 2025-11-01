'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import api, { getUser } from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'

export default function CustomerProfile() {
  const [user, setUser] = useState(null)

  // ✅ Load the logged-in user from localStorage
  useEffect(() => {
    const u = getUser()
    if (!u) {
      toast.error('⚠️ You must log in first.')
      setTimeout(() => (window.location.href = '/login'), 2000)
      return
    }
    setUser(u)
  }, [])

  // ✅ Fetcher for SWR
  const fetcher = async () => {
    if (!user?.msisdn) throw new Error('Missing customer MSISDN.')
    const data = await api.getCustomerByMsisdn(user.msisdn)
    return data
  }

  const { data, error, isLoading } = useSWR(
    user?.msisdn ? ['customer-profile', user.msisdn] : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  )

  // ✅ Handle loading and errors
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
    console.error('❌ Failed to load customer profile:', error)
    toast.error('❌ Failed to load customer profile.')
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <p>Something went wrong while loading your profile.</p>
      </div>
    )
  }

  const customer = data?.data || data || {}

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          👤 Customer Profile
        </h1>

        <div className="space-y-3">
          <ProfileRow label="Full Name" value={customer.fullName} />
          <ProfileRow label="Email" value={customer.email} />
          <ProfileRow label="Phone (MSISDN)" value={customer.msisdn} />
          <ProfileRow label="Wallet Balance" value={`₦${customer.walletBalance || 0}`} />
          <ProfileRow label="Status" value={customer.status || 'ACTIVE'} />
          <ProfileRow
            label="Registered"
            value={new Date(customer.createdAt).toLocaleString()}
          />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * Small Component for Displaying Rows
 * ============================================================
 */
function ProfileRow({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-100 py-2">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="text-gray-800">{value || '—'}</span>
    </div>
  )
}
