'use client'

import useSWR from 'swr'
import { useState } from 'react'
import api, { getToken } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function SubvendorDataPlan() {
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [newPrice, setNewPrice] = useState('')
  const [msg, setMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [margin, setMargin] = useState('')
  const [applyingMargin, setApplyingMargin] = useState(false)
  const [avgPrice, setAvgPrice] = useState(null) // ✅ Co-subvendor avg
  const [warning, setWarning] = useState('') // ✅ Warning message

  const subvendorId = typeof window !== 'undefined'
    ? localStorage.getItem('subvendorId')
    : null // Assuming subvendorId is stored in localStorage after login

  // ✅ SWR fetcher
  const fetcher = async () => {
    if (!getToken()) throw new Error('Not authenticated')
    return api.listSubvendorDataPlans()
  }

  const { data: plans, error, isLoading, mutate } = useSWR('subvendor_plans', fetcher)

  // ✅ Get co-subvendor average price
  const fetchCoVendorAverage = async (planId) => {
    try {
      const res = await api.get(`/subvendor_plans/${planId}/co-vendor-stats?currentSubvendorId=${subvendorId}`)
      setAvgPrice(res.data.avgPrice)
    } catch (err) {
      console.error('Error fetching co-vendor average:', err)
    }
  }

  // ✅ Trigger warning if price is significantly higher
  const checkPriceDifference = (enteredPrice) => {
    if (!avgPrice) return
    const diffPercent = ((enteredPrice - avgPrice) / avgPrice) * 100
    if (diffPercent > 15) {
      setWarning('⚠️ Your price is significantly higher; you may lose customers.')
    } else {
      setWarning('')
    }
  }

  // ✅ Manual update of a single plan
  const handlePriceUpdate = async (e) => {
    e.preventDefault()
    if (!selectedPlan) return
    if (!newPrice || isNaN(newPrice)) {
      return setMsg('❌ Please enter a valid price')
    }

    setSubmitting(true)
    setMsg('')

    try {
      await api.updateSubvendorDataPlan(selectedPlan.id, {
        customPrice: parseFloat(newPrice),
      })
      setMsg('✅ Price updated successfully!')
      setSelectedPlan(null)
      setNewPrice('')
      await mutate()
    } catch (err) {
      console.error(err)
      setMsg('❌ Failed to update price. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ✅ Apply percentage margin to all plans
  const handleApplyMargin = async () => {
    if (!margin || isNaN(margin)) return setMsg('❌ Enter a valid percentage')
    if (!plans || plans.length === 0) return setMsg('❌ No plans to update')

    setApplyingMargin(true)
    setMsg('')

    try {
      const percent = parseFloat(margin)
      const updatedPlans = plans.map((p) => ({
        id: p.id,
        customPrice: parseFloat((p.basePrice * (1 + percent / 100)).toFixed(2)),
      }))

      for (const plan of updatedPlans) {
        await api.updateSubvendorDataPlan(plan.id, { customPrice: plan.customPrice })
      }

      setMsg(`✅ Applied ${percent}% margin to all plans successfully!`)
      setMargin('')
      await mutate()
    } catch (err) {
      console.error(err)
      setMsg('❌ Failed to apply margin. Try again.')
    } finally {
      setApplyingMargin(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto mt-10 px-4">
        <h2 className="text-2xl font-semibold mb-6">📡 My Data Plans</h2>

        {msg && (
          <p
            className={`mb-4 text-sm ${
              msg.includes('✅') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {msg}
          </p>
        )}

        {/* ✅ Global Margin Update Section */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-blue-700 mb-2">
            💹 Apply Percentage Margin to All Plans
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              step="0.01"
              placeholder="Enter margin (10 means 10%)"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              className="border rounded p-2 w-42"
            />
            <button
              onClick={handleApplyMargin}
              disabled={applyingMargin}
              className={`px-4 py-2 rounded text-white ${
                applyingMargin
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {applyingMargin ? 'Applying...' : 'Apply Margin'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This will update all custom prices = base price × (1 + margin / 100)
          </p>
        </div>

        {/* ✅ Data Plans Table */}
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          {isLoading && <p>Loading data plans...</p>}
          {error && (
            <p className="text-red-600">
              ❌ Failed to load data plans: {error.message}
            </p>
          )}

          {!isLoading && !error && (
            <table className="min-w-full table-auto border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr className="text-left border-b">
                  <th className="p-2">Name</th>
                  <th className="p-2">ERS Plan ID</th>
                  <th className="p-2">Data Service</th>
                  <th className="p-2">Base Price (₦)</th>
                  <th className="p-2 bg-blue-50 text-blue-800 font-semibold">
                    Custom Price (₦)
                  </th>
                  <th className="p-2">Profit (₦)</th>
                  <th className="p-2">Validity (Days)</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Created</th>
                  <th className="p-2">Updated</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {plans && plans.length > 0 ? (
                  plans.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{p.name}</td>
                      <td className="p-2">{p.ersPlanId}</td>
                      <td className="p-2">{p.dataServices || '-'}</td>
                      <td className="p-2">{p.basePrice?.toFixed(2) || '0.00'}</td>

                      <td
                        className={`p-2 font-semibold text-blue-800 ${
                          p.customPrice > p.basePrice
                            ? 'bg-green-50'
                            : 'bg-yellow-50'
                        }`}
                      >
                        {p.customPrice?.toFixed(2) || '0.00'}
                      </td>

                      <td
                        className={`p-2 font-semibold ${
                          p.customPrice > p.basePrice
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {(p.customPrice - p.basePrice).toFixed(2)}
                      </td>
                      <td className="p-2">{p.validityDays}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            p.status?.toLowerCase() === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {p.status || 'N/A'}
                        </span>
                      </td>
                      <td className="p-2">
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="p-2">
                        {p.updatedAt
                          ? new Date(p.updatedAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => {
                            setSelectedPlan(p)
                            fetchCoVendorAverage(p.id)
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                        >
                          Update Price
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-4 text-center text-gray-500" colSpan={11}>
                      No data plans available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ✅ Update Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
              <button
                onClick={() => {
                  setSelectedPlan(null)
                  setWarning('')
                  setAvgPrice(null)
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>

              <h3 className="text-lg font-semibold mb-3">Update Custom Price</h3>

              <p className="text-sm mb-2 text-gray-600">
                Plan: <strong>{selectedPlan.name}</strong>
              </p>
              {avgPrice && (
                <p className="text-xs text-gray-500 mb-3">
                  Avg price from co-subvendors: ₦{avgPrice.toFixed(2)}
                </p>
              )}

              <form onSubmit={handlePriceUpdate} className="space-y-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter new price"
                  value={newPrice}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    setNewPrice(e.target.value)
                    checkPriceDifference(val)
                  }}
                  className="w-full border rounded p-2"
                  required
                />

                {warning && (
                  <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-300 rounded p-2">
                    {warning}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-2 rounded text-white transition ${
                    submitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submitting ? 'Updating...' : 'Save Price'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
