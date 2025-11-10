'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'

// Helper to format currency
const formatCurrency = (amount) => {
  if (!amount) return '₦0.00'
  const num = Number(amount)
  return num.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })
}

// Helper to format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function Profile() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const subvendorId = localStorage.getItem('subvendorId')
        if (!subvendorId) throw new Error('Subvendor ID not found in localStorage')
        const data = await api.getSubvendorById(subvendorId)
        setProfile(data)
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      }
    }
    fetchProfile()
  }, [])

  if (!profile) return <p className="text-center py-4">Loading profile...</p>

  return (
    <div className="bg-white p-6 rounded shadow max-w-xl mx-auto mt-6">
      <h2 className="text-2xl font-semibold mb-6 text-center">Subvendor Profile</h2>
      <div className="space-y-3">
        <p>
          <strong>Business Name:</strong> {profile.businessName || '-'}
        </p>
        <p>
          <strong>Contact Person:</strong> {profile.contactPerson || '-'}
        </p>
        <p>
          <strong>Email:</strong> {profile.email || '-'}
        </p>
        <p>
          <strong>Phone:</strong> {profile.phone || '-'}
        </p>
        <p>
          <strong>Address:</strong> {profile.address || '-'}
        </p>
        <p>
          <strong>Wallet Balance:</strong>{' '}
          <span className="font-medium">{formatCurrency(profile.walletBalance)}</span>
        </p>
        <p>
          <strong>Created At:</strong> {formatDate(profile.createdAt)}
        </p>
        <p>
          <strong>Last Updated:</strong> {formatDate(profile.updatedAt)}
        </p>
        <p>
          <strong>Status:</strong> <span className="capitalize">{profile.status || 'Active'}</span>
        </p>
      </div>
    </div>
  )
}
