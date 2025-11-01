'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import api, { getUser, getRole } from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'

export default function WalletDashboard() {
  const router = useRouter()
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fetchingRef = useRef(false)
  const userRole = getRole()

  /* ============================================================
   * Fetch Wallet Data
   * ============================================================ */
  const fetchWalletData = async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const user = getUser()

      if (!user?.email || !userRole) {
        toast.error('⚠️ Session expired. Please log in again.')
        router.push('/login')
        return
      }

      const [balanceData, txns] = await Promise.all([
        api.getWalletBalance(user.email, userRole),
        api.listWalletTransactions(user.email),
      ])

      setWalletBalance(balanceData?.balance ?? 0)
      setTransactions(Array.isArray(txns) ? txns : [])
    } catch (err) {
      console.error('❌ Wallet fetch error:', err)
      setError('Failed to load wallet data.')
      toast.error('❌ Failed to fetch wallet data.')
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    fetchWalletData()
    const interval = setInterval(fetchWalletData, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading)
    return (
      <ProtectedRoute>
        <div className="p-6 text-center text-gray-500 animate-pulse">
          Loading wallet...
        </div>
      </ProtectedRoute>
    )

  if (error)
    return (
      <ProtectedRoute>
        <div className="p-6 text-center text-red-500">{error}</div>
      </ProtectedRoute>
    )

  /* ============================================================
   * UI
   * ============================================================ */
  return (
    <ProtectedRoute>
      <div className="p-6 max-w-5xl mx-auto relative">
        <Toaster position="top-center" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">💰 My Wallet</h2>
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg shadow font-medium">
              Balance: ₦{walletBalance.toLocaleString()}
            </div>
            <button
              onClick={() => router.push('/payment-form')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow font-medium transition"
            >
              Fund Wallet
            </button>
          </div>
        </div>

        {/* Mobile fixed button */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center md:hidden">
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full shadow mb-2 text-sm font-medium">
            ₦{walletBalance.toLocaleString()}
          </div>
          <button
            onClick={() => router.push('/payment-form')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg font-medium transition"
          >
            Fund Wallet
          </button>
        </div>

        {/* Transactions Table */}
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h3 className="text-lg font-medium mb-4">Transaction History</h3>

          {transactions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center">
              No transactions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 border-b">Date</th>
                    <th className="px-3 py-2 border-b">Type</th>
                    <th className="px-3 py-2 border-b">Amount (₦)</th>
                    <th className="px-3 py-2 border-b">Reference</th>
                    <th className="px-3 py-2 border-b">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50 border-b">
                      <td className="px-3 py-2 text-sm whitespace-nowrap">
                        {new Date(txn.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-sm capitalize whitespace-nowrap">
                        {txn.txnType}
                      </td>
                      <td
                        className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${
                          txn.txnType === 'FUNDING'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {txn.amount?.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-sm font-mono whitespace-nowrap">
                        {txn.reference || '—'}
                      </td>
                      <td className="px-3 py-2 text-sm whitespace-nowrap">
                        {txn.status === 'SUCCESS' ? (
                          <span className="text-green-600 font-medium">✅ Success</span>
                        ) : txn.status === 'PENDING' ? (
                          <span className="text-yellow-500 font-medium">⏳ Pending</span>
                        ) : (
                          <span className="text-red-600 font-medium">❌ Failed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
