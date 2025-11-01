'use client'

import useSWR from 'swr'
import { useEffect, useState } from 'react'
import api, { getToken } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function WalletTransactions() {
  const [isReady, setIsReady] = useState(false)
  const [token, setToken] = useState(null)

  // Wait for token to load from localStorage
  useEffect(() => {
    const tk = getToken()
    if (tk) {
      setToken(tk)
      setIsReady(true)
    }
  }, [])

  // Fetch only when token is ready
  const { data: txns, error, isLoading } = useSWR(
    isReady ? 'wallet_txns' : null,
    api.listWalletTransactions
  )

  // Skeleton row while loading
  const SkeletonRow = () => (
    <tr className="animate-pulse border-t">
      {Array.from({ length: 10 }).map((_, i) => (
        <td key={i} className="p-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  )

  return (
    <ProtectedRoute>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Wallet Transactions</h2>

        <div className="bg-white rounded shadow p-4 mt-2 overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead>
              <tr className="text-left bg-gray-100">
                <th className="p-2">Reference</th>
                <th className="p-2">User ID</th>
                <th className="p-2">Email</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Txn Type</th> {/* ✅ Added txn_type column */}
                <th className="p-2">Status</th>
                <th className="p-2">Role</th>
                <th className="p-2">Balance Before</th>
                <th className="p-2">Balance After</th>
                <th className="p-2">Created At</th>
              </tr>
            </thead>

            <tbody>
              {/* Skeleton Loader */}
              {isLoading && (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </>
              )}

              {/* Display error only for actual API/network issues */}
              {!isLoading && error && (
                <tr>
                  <td className="p-4 text-center text-red-500" colSpan={10}>
                    Failed to load transactions. Please try again.
                  </td>
                </tr>
              )}

              {/* Display data or "Not found" message */}
              {!isLoading && !error && (
                <>
                  {txns && Array.isArray(txns) && txns.length > 0 ? (
                    txns.map((t) => (
                      <tr key={t.id} className="border-t hover:bg-gray-50">
                        <td className="p-2 font-medium">{t.reference}</td>
                        <td className="p-2">{t.userId || t.user_id || '-'}</td>
                        <td className="p-2">{t.email || '-'}</td>
                        <td className="p-2">{t.amount}</td>
                        {/* ✅ Replaced purpose with txn_type */}
                        <td className="p-2">{t.txn_type || '-'}</td>
                        <td className="p-2">
                          {t.status === 'SUCCESS' || t.status === 'COMPLETED' ? (
                            <span className="text-green-600 font-medium">{t.status}</span>
                          ) : t.status === 'FAILED' ? (
                            <span className="text-red-600 font-medium">{t.status}</span>
                          ) : (
                            <span className="text-yellow-600 font-medium">{t.status}</span>
                          )}
                        </td>
                        <td className="p-2">{t.role || '-'}</td>
                        <td className="p-2">{t.balanceBefore ?? '-'}</td>
                        <td className="p-2">{t.balanceAfter ?? '-'}</td>
                        <td className="p-2">
                          {t.createdAt ? new Date(t.createdAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-4 text-center text-gray-500" colSpan={10}>
                        No transactions found
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  )
}
