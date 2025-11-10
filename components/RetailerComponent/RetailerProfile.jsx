'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import api from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'

export default function RetailerProfile() {
  const [retailerId, setRetailerId] = useState(null)

  // ✅ Load retailerId from localStorage
  useEffect(() => {
    const id = typeof window !== 'undefined' ? localStorage.getItem('retailerId') : null
    if (!id) {
      toast.error('⚠️ Retailer not logged in.')
      setTimeout(() => (window.location.href = '/login'), 2000)
      return
    }
    setRetailerId(id)
  }, [])

  // ✅ Fetcher using getRetailerById
  const fetcher = async () => {
    if (!retailerId) throw new Error('Retailer ID missing.')
    const data = await api.getRetailerById(retailerId)
    return data
  }

  // ✅ SWR fetch with auto-refresh every 10s for real-time balance
  const { data, error, isLoading, mutate } = useSWR(
    retailerId ? ['retailer-profile', retailerId] : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 10000, // 🔁 auto-refresh every 10s
      shouldRetryOnError: true,
    }
  )

  // ✅ Handle loading and errors
  if (!retailerId)
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
    console.error('❌ Failed to load retailer profile:', error)
    toast.error('❌ Failed to load retailer profile.')
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <p>Something went wrong while loading your profile.</p>
      </div>
    )
  }

  const retailer = data?.data || data || {}

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">👤 Retailer Profile</h1>
          <button
            onClick={() => mutate()}
            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-3">
          <ProfileRow label="Full Name" value={retailer.name} />
          <ProfileRow label="Email" value={retailer.email} />
          <ProfileRow label="Phone" value={retailer.phone} />
          <ProfileRow label="Business Name" value={retailer.businessName} />
          <ProfileRow
            label="Wallet Balance"
            value={`₦${Number(retailer.walletBalance || 0).toFixed(2)}`}
          />
          <ProfileRow
            label="Registered"
            value={retailer.createdAt ? new Date(retailer.createdAt).toLocaleString() : '—'}
          />
        </div>

        <div className="mt-8 text-sm text-gray-400 text-center">
          Auto-refreshes every 10 seconds 🔁
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * Small Component for Displaying Rows
 * ============================================================ */
function ProfileRow({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-100 py-2">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="text-gray-800">{value || '—'}</span>
    </div>
  )
}
