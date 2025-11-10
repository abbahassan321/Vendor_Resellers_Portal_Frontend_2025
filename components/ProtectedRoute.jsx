'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authReady } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!authReady) return // wait until auth state is determined

    // ✅ If not authenticated (e.g. token expired or refresh), redirect to landing
    if (!isAuthenticated) {
      const timeout = setTimeout(() => {
        router.replace('/') // force landing page
      }, 500) // small delay for smooth redirect

      return () => clearTimeout(timeout)
    } else {
      setChecking(false)
    }
  }, [authReady, isAuthenticated, router])

  // ✅ Show loading state until we know auth status
  if (checking || !authReady)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 animate-pulse">
        Checking session...
      </div>
    )

  return isAuthenticated ? children : null
}
