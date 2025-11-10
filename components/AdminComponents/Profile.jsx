'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'

export default function SuperAdminProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const superAdminId = localStorage.getItem('superAdminId') // Or get from token/session
        if (!superAdminId) throw new Error('Super Admin ID not found')

        const data = await api.getAdminById(superAdminId)
        setProfile(data)
      } catch (err) {
        console.error('Failed to fetch Super Admin profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (loading) return <p className="text-center mt-6">Loading profile...</p>
  if (!profile) return <p className="text-center mt-6 text-red-500">Profile not found.</p>

  return (
    <div className="bg-white p-6 rounded shadow max-w-md mx-auto mt-6">
      <h2 className="text-xl font-semibold mb-4 text-center">Super Admin Profile</h2>
      <div className="space-y-2">
        <p><strong>Username:</strong> {profile.username}</p>
        <p><strong>Role:</strong> {profile.role || 'SUPERADMIN'}</p>
        <p><strong>Created At:</strong> {new Date(profile.createdAt).toLocaleString()}</p>
      </div>
    </div>
  )
}
