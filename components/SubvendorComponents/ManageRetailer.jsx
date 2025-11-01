'use client'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import api from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function ManageRetailers() {
  const [subvendor, setSubvendor] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' })
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedRetailer, setSelectedRetailer] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('glovendor_user')
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      if (parsed.role === 'SUBVENDOR') setSubvendor(parsed)
    }
  }, [])

  const { data: retailers, error, isLoading, mutate } = useSWR(
    subvendor ? `retailers-my` : null,
    () => api.listMyRetailers(),
    { refreshInterval: 10000 }
  )

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (!subvendor) throw new Error('Subvendor not found.')

      if (isEditing && selectedRetailer) {
        await api.updateRetailer(selectedRetailer.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        })
        showToast('success', 'Retailer updated successfully.')
      } else {
        const res = await api.createRetailerForSubvendor(formData)
        if (!res || res.status >= 400) throw new Error('Failed to create retailer.')
        showToast('success', 'Retailer created successfully.')
      }

      mutate()
      setShowModal(false)
      setFormData({ name: '', email: '', phone: '', password: '' })
    } catch (err) {
      console.error('Retailer creation failed:', err)
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to create retailer.'
      showToast('error', msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this retailer?')) return
    try {
      await api.deleteRetailer(id)
      mutate()
      showToast('success', 'Retailer deleted successfully.')
    } catch (err) {
      console.error('Failed to delete retailer:', err)
      showToast('error', 'Failed to delete retailer.')
    }
  }

  return (
    <ProtectedRoute>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">
            {subvendor ? `${subvendor.email}'s Retailers` : 'My Retailers'}
          </h2>
          <button
            onClick={() => {
              setShowModal(true)
              setIsEditing(false)
              setSelectedRetailer(null)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Retailer
          </button>
        </div>

        {toast && (
          <div
            className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.message}
          </div>
        )}

        {isLoading && <p>Loading retailers...</p>}
        {error && <p className="text-red-500">Failed to load retailers</p>}

        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          {retailers && retailers.length > 0 ? (
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3">Phone</th>
                  <th className="py-2 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {retailers.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{r.id}</td>
                    <td className="py-2 px-3 font-medium">{r.name}</td>
                    <td className="py-2 px-3">{r.email}</td>
                    <td className="py-2 px-3">{r.phone}</td>
                    <td className="py-2 px-3 text-center space-x-3">
                      <button
                        onClick={() => {
                          setIsEditing(true)
                          setSelectedRetailer(r)
                          setFormData({
                            name: r.name,
                            email: r.email,
                            phone: r.phone,
                            password: '',
                          })
                          setShowModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            !isLoading && <p className="text-gray-500">No retailers found.</p>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
              <h3 className="text-lg font-semibold mb-4">
                {isEditing ? 'Edit Retailer' : 'Create Retailer'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 w-full"
                  required
                />
                <input
                  name="email"
                  placeholder="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 w-full"
                  required
                />
                <input
                  name="phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 w-full"
                  required
                />
                {!isEditing && (
                  <input
                    name="password"
                    placeholder="Password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 w-full"
                    required
                  />
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
                >
                  {submitting
                    ? 'Saving...'
                    : isEditing
                    ? 'Update Retailer'
                    : 'Create Retailer'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
