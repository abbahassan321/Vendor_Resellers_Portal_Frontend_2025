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
  const user = getUser()
  const userRole = getRole()

  /* ============================================================
   * Fetch Wallet Data (Balance + Transactions)
   * ============================================================ */
  const fetchWalletData = async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    setError(null)

    try {
      if (!user?.email || !userRole) {
        toast.error('⚠️ Session expired. Please log in again.')
        router.push('/login')
        return
      }

      // ✅ Use query params for backend
      const [balanceData, userTxns] = await Promise.all([
        api.getWalletBalance(user.email, userRole),
        api.listWalletTransactions(user.email, userRole), // updated
      ])

      setWalletBalance(balanceData?.balance ?? 0)
      setTransactions(Array.isArray(userTxns) ? userTxns : [])
    } catch (err) {
      console.error('❌ Wallet fetch error:', err.response || err)
      setError('Failed to load wallet data.')
      toast.error('❌ Failed to fetch wallet data.')
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  /* ============================================================
   * Lifecycle: Fetch on mount + auto-refresh every 15s
   * ============================================================ */
  useEffect(() => {
    fetchWalletData()
    const interval = setInterval(fetchWalletData, 15000)
    return () => clearInterval(interval)
  }, [])

  /* ============================================================
   * Skeleton Row for Loading
   * ============================================================ */
  const SkeletonRow = () => (
    <tr className="animate-pulse border-b">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-3 py-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  )

  /* ============================================================
   * Render Loading or Error State
   * ============================================================ */
  if (loading)
    return (
      <ProtectedRoute>
        <div className="p-6 max-w-5xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <table className="w-full text-left table-auto border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 border-b">Date</th>
                  <th className="px-3 py-2 border-b">Type</th>
                  <th className="px-3 py-2 border-b">Amount (₦)</th>
                  <th className="px-3 py-2 border-b">Reference</th>
                  <th className="px-3 py-2 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
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
   * Render Main Wallet Dashboard
   * ============================================================ */
  return (
    <ProtectedRoute>
      <div className="p-6 max-w-5xl mx-auto relative">
        <Toaster position="top-center" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">💰 My Wallet</h2>
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg shadow font-medium">
            Balance: ₦{walletBalance.toLocaleString()}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Transaction History</h3>
            <button
              onClick={fetchWalletData}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition"
            >
              Refresh
            </button>
          </div>

          {transactions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
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
                        {txn.createdAt ? new Date(txn.createdAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-3 py-2 text-sm capitalize whitespace-nowrap">
                        {txn.txnType?.toLowerCase() === 'funding' ? 'Funding' : 'Debit'}
                      </td>
                      <td
                        className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${
                          txn.txnType?.toLowerCase() === 'funding' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {Number(txn.amount).toLocaleString()}
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
