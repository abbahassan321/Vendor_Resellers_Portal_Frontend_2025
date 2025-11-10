'use client';
import { useState } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

/* ============================================================
 * 📘 ManageAggregators Component
 * - Includes create, update, delete, list
 * - Now includes a skeleton loader for data fetching
 * ============================================================ */
export default function ManageAggregators() {
  const {
    data: aggs,
    error,
    isLoading,
    mutate,
  } = useSWR('aggs', api.listAggregators, {
    refreshInterval: 8000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAgg, setSelectedAgg] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [filterType, setFilterType] = useState('email');
  const [filterValue, setFilterValue] = useState('');

  /* ============================================================
   * Toast Utility
   * ============================================================ */
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  /* ============================================================
   * Form Input Handler
   * ============================================================ */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  /* ============================================================
   * Filtered Aggregators
   * ============================================================ */
  const filteredAggregators = aggs?.filter((a) => {
    if (!filterValue) return true;
    const fieldValue = (a[filterType] || '').toLowerCase();
    return fieldValue.includes(filterValue.toLowerCase());
  });

  /* ============================================================
   * Create or Update Aggregator
   * ============================================================ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditing && selectedAgg) {
        await api.updateAggregator(selectedAgg.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        });
        showToast('success', 'Aggregator updated successfully');
      } else {
        await api.createAggregator({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        });
        showToast('success', 'Aggregator created successfully');
      }

      mutate(); // ✅ refresh SWR cache
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Aggregator action failed:', err);
      showToast('error', err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================================
   * Delete Aggregator
   * ============================================================ */
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this aggregator?')) return;
    try {
      await api.deleteAggregator(id);
      mutate();
      showToast('success', 'Aggregator deleted successfully');
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to delete aggregator');
    }
  };

  /* ============================================================
   * Helpers
   * ============================================================ */
  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', password: '' });
    setIsEditing(false);
    setSelectedAgg(null);
  };

  const handleEdit = (agg) => {
    setSelectedAgg(agg);
    setFormData({
      name: agg.name || '',
      email: agg.email || '',
      phone: agg.phone || '',
      password: '',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  /* ============================================================
   * Skeleton Loader
   * ============================================================ */
  const SkeletonRow = () => (
    <tr className="animate-pulse border-b">
      <td className="py-2 px-3"><div className="h-4 bg-gray-200 rounded w-6"></div></td>
      <td className="py-2 px-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
      <td className="py-2 px-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
      <td className="py-2 px-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
      <td className="py-2 px-3"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
      <td className="py-2 px-3 text-center"><div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div></td>
    </tr>
  );

  /* ============================================================
   * UI
   * ============================================================ */
  return (
    <ProtectedRoute>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Aggregators</h2>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Aggregator
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } animate-slide-in`}
          >
            {toast.message}
          </div>
        )}

        {/* Filter Section */}
        <div className="flex items-center gap-3 mb-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="email">Filter by Email</option>
            <option value="phone">Filter by Phone</option>
          </select>
          <input
            type="text"
            placeholder={`Search by ${filterType}`}
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="border rounded px-3 py-2 w-60"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          {isLoading ? (
            <table className="min-w-full text-sm border-collapse">
              <thead className="border-b font-medium bg-gray-50">
                <tr>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3">Phone</th>
                  <th className="py-2 px-3">Created At</th>
                  <th className="py-2 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          ) : error ? (
            <p className="text-red-500">Failed to load aggregators.</p>
          ) : filteredAggregators?.length > 0 ? (
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="border-b font-medium bg-gray-50">
                <tr>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3">Phone</th>
                  <th className="py-2 px-3">Created At</th>
                  <th className="py-2 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAggregators.map((a) => (
                  <tr key={a.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{a.id || '—'}</td>
                    <td className="py-2 px-3 font-medium">{a.name || '—'}</td>
                    <td className="py-2 px-3">{a.email || '—'}</td>
                    <td className="py-2 px-3">{a.phone || '—'}</td>
                    <td className="py-2 px-3 text-gray-500">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-2 px-3 text-center space-x-2">
                      <button
                        onClick={() => handleEdit(a)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No aggregators found.</p>
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
                {isEditing ? 'Edit Aggregator' : 'Create Aggregator'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                    disabled={isEditing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full mt-2 px-4 py-2 rounded text-white ${
                    submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submitting
                    ? isEditing
                      ? 'Updating...'
                      : 'Creating...'
                    : isEditing
                    ? 'Update Aggregator'
                    : 'Create Aggregator'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Toast Animation */}
      <style jsx>{`
        .animate-slide-in {
          transform: translateX(100%);
          animation: slideIn 0.3s forwards;
        }
        @keyframes slideIn {
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}
