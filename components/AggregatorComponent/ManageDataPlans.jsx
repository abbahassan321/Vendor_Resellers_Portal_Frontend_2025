'use client'

import useSWR from 'swr'
import { useState } from 'react'
import api, { getToken } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

export default function ManageDataPlans() {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterService, setFilterService] = useState('ALL')
  const [sortBy, setSortBy] = useState('createdAt')

  // ---------------- SWR Fetcher ----------------
  const fetcher = async () => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')
    return api.listDataPlans()
  }

  const { data: plans, error, isLoading, mutate } = useSWR('data_plans', fetcher)

  // ---------------- Upload Handler ----------------
  async function handleUpload(e) {
    e.preventDefault()
    setMsg('')
    if (!file) return setMsg('⚠️ Please choose a file first.')
    if (!getToken()) return setMsg('You must be logged in to upload.')

    setUploading(true)
    setProgress(0)

    try {
      // ✅ Use API helper
      const res = await api.uploadDataPlans(file, user?.email, {
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total))
        },
      })

      if (res?.success || res?.uploadedCount) {
        setMsg(`✅ Uploaded ${res.uploadedCount || 0} plans successfully!`)
        await mutate()
      } else {
        setMsg(`⚠️ ${res?.message || 'Upload failed'}`)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setMsg(err?.response?.data?.message || err.message || '❌ Upload failed')
    } finally {
      setUploading(false)
      setFile(null)
      setTimeout(() => setProgress(0), 1500)
    }
  }

  // ---------------- Filtering ----------------
  const filteredPlans = (plans || []).filter((p) => {
    const statusMatch =
      filterStatus === 'ALL' || p.status?.toLowerCase() === filterStatus.toLowerCase()
    const serviceMatch =
      filterService === 'ALL' ||
      p.dataServices?.toLowerCase().includes(filterService.toLowerCase())
    return statusMatch && serviceMatch
  })

  // ---------------- Sorting ----------------
  const sortedPlans = [...filteredPlans].sort((a, b) => {
    if (sortBy === 'price') return (a.price || 0) - (b.price || 0)
    if (sortBy === 'validity') return (a.validityDays || 0) - (b.validityDays || 0)
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto mt-10 px-4">
        {/* ---------------- Header ---------------- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold mb-3 md:mb-0">📡 Manage Data Plans</h2>
          <button
            onClick={() => mutate()}
            disabled={uploading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            <RefreshCw className={`w-4 h-4 ${uploading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ---------------- Upload Section ---------------- */}
        <div className="bg-white rounded shadow p-4 mb-6">
          <form
            onSubmit={handleUpload}
            className="flex flex-col md:flex-row items-start md:items-center gap-3"
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="border rounded p-2 text-sm"
            />
            <button
              type="submit"
              disabled={uploading}
              className={`px-4 py-2 text-white rounded ${
                uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>

          {/* Progress Bar */}
          {uploading && (
            <div className="mt-3 w-full bg-gray-200 rounded h-3 overflow-hidden">
              <div
                className="bg-green-600 h-3 rounded transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Upload Message */}
          {msg && (
            <p
              className={`mt-2 text-sm ${
                msg.startsWith('✅') ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {msg}
            </p>
          )}
        </div>

        {/* ---------------- Filters ---------------- */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div>
            <label className="mr-2 text-sm font-medium">Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded p-2 text-sm"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          <div>
            <label className="mr-2 text-sm font-medium">Filter by Service:</label>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="border rounded p-2 text-sm"
            >
              <option value="ALL">All</option>
              {Array.from(new Set(plans?.map((p) => p.dataServices).filter(Boolean))).map(
                (service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mr-2 text-sm font-medium">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded p-2 text-sm"
            >
              <option value="createdAt">Date Created</option>
              <option value="price">Price</option>
              <option value="validity">Validity</option>
            </select>
          </div>
        </div>

        {/* ---------------- Table ---------------- */}
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          {isLoading && (
            <p className="text-gray-600 animate-pulse">Loading data plans...</p>
          )}
          {error && <p className="text-red-600">Failed to load: {error.message}</p>}

          {!isLoading && !error && (
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr className="border-b">
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Service</th>
                  <th className="p-2 text-left">Validity</th>
                  <th className="p-2 text-left">Price (₦)</th>
                  <th className="p-2 text-left">ERS ID</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Created</th>
                  <th className="p-2 text-left">Updated</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlans.length > 0 ? (
                  sortedPlans.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 font-medium">{p.id}</td>
                      <td className="p-2">{p.name || p.planName}</td>
                      <td className="p-2">{p.dataServices || '-'}</td>
                      <td className="p-2">{p.validityDays || '-'}</td>
                      <td className="p-2">{p.price?.toLocaleString() || '-'}</td>
                      <td className="p-2">{p.ersPlanId || '-'}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            p.status?.toLowerCase() === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {p.status || 'N/A'}
                        </span>
                      </td>
                      <td className="p-2">
                        {p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}
                      </td>
                      <td className="p-2">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-4 text-center" colSpan={9}>
                      No data plans found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
