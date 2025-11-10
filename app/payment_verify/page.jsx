'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import api from '@/lib/api'
import { useAuth } from '@/components/AuthProvider'

export default function VerifyPaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [verifying, setVerifying] = useState(true)
  const [toastId, setToastId] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const reference = searchParams.get('reference')
    if (!reference) {
      toast.error('❌ No payment reference found in URL.')
      setVerifying(false)
      return
    }

    let didCancel = false

    async function verifyPayment() {
      if (!toastId) setToastId(toast.loading('🔄 Verifying your payment...'))

      try {
        const res = await api.get(`/api/payments/verify/${reference}`)
        const data = res.data?.data || res.data
        console.log('✅ Payment verification response:', data)

        const isSuccess =
          data?.status?.toUpperCase() === 'SUCCESS' ||
          data?.data?.status === 'success'

        if (!didCancel) {
          if (isSuccess) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('last_payment_details', JSON.stringify(data))
            }

            // Fallback to localStorage if user is null
            let currentUser = user
            if (!currentUser && typeof window !== 'undefined') {
              try {
                currentUser = JSON.parse(localStorage.getItem('user') || '{}')
              } catch {
                currentUser = {}
              }
            }

            const role = currentUser?.role?.toLowerCase() || 'customer'

            const redirectMap = {
              aggregator: '/aggregator_dashboard',
              subvendor: '/subvendor_dashboard',
              customer: '/customer_dashboard',
              retailer: '/retailer_dashboard',
            }

            const dashboardRoute = redirectMap[role] || '/dashboard'

            // ✅ Use same toastId to prevent duplicates
            toast.success('🎉 Payment verified successfully!', {
              id: toastId,
              duration: 2500,
            })

            setTimeout(() => {
              router.push(dashboardRoute)
            }, 2000)
          } else {
            toast.error('⚠️ Payment not successful or still pending.', {
              id: toastId,
            })
          }
        }
      } catch (err) {
        if (!didCancel) {
          console.error('❌ Payment verification error:', err)
          const errMsg =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            'Payment verification failed.'

          toast.error('❌ ' + errMsg, { id: toastId })
        }
      } finally {
        if (!didCancel) setVerifying(false)
      }
    }

    verifyPayment()

    return () => {
      didCancel = true
    }
  }, [searchParams, router, user, toastId])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      {/* Single Toaster */}
      <Toaster position="top-center" reverseOrder={false} />

      {verifying ? (
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">
          <div className="animate-spin mx-auto mb-4 border-4 border-blue-300 border-t-blue-600 rounded-full w-12 h-12"></div>
          <h2 className="text-lg font-medium text-gray-700">
            Verifying your payment...
          </h2>
          <p className="text-gray-500 text-sm mt-2">Please wait...</p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">
          <h2 className="text-lg font-medium text-gray-700">
            Check your wallet for the latest update.
          </h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  )
}
