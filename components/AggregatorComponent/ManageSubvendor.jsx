'use client';

import { useState } from 'react';
import useSWR from 'swr';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ManageSubvendor() {
  const { data: subs, error, isLoading, mutate } = useSWR('subs', api.listSubvendors);

  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [form, setForm] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingSub(null);
    setForm({
      businessName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      password: '',
    });
    setShowModal(true);
  };

  const openEditModal = (sub) => {
    setEditingSub(sub);
    setForm({
      businessName: sub.businessName || '',
      contactPerson: sub.contactPerson || '',
      email: sub.email || '',
      phone: sub.phone || '',
      address: sub.address || '',
      password: '',
    });
    setShowModal(true);
  };

  const validateForm = () => {
    if (!form.businessName.trim()) return 'Business name is required';
    if (!form.contactPerson.trim()) return 'Contact person is required';
    if (!form.email.trim()) return 'Email is required';
    if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(form.email)) return 'Invalid email format';
    if (!form.phone.trim()) return 'Phone number is required';
    if (!/^[0-9]{7,15}$/.test(form.phone)) return 'Invalid phone number';
    if (!editingSub && !form.password.trim()) return 'Password is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) return toast.error(errorMsg);

    setSubmitting(true);
    const toastId = toast.loading(editingSub ? 'Updating subvendor...' : 'Creating subvendor...');

    try {
      if (editingSub) {
        await api.updateSubvendor(editingSub.id, {
          businessName: form.businessName,
          contactPerson: form.contactPerson,
          email: form.email,
          address: form.address,
          phone: form.phone,
          ...(form.password ? { passwordHash: form.password } : {}),
        });
        toast.success('✅ Subvendor updated successfully!', { id: toastId });
      } else {
        await api.createSubvendor({
          businessName: form.businessName,
          contactPerson: form.contactPerson,
          email: form.email,
          address: form.address,
          phone: form.phone,
          passwordHash: form.password,
        });
        toast.success('✅ Subvendor created successfully!', { id: toastId });
      }

      setShowModal(false);
      mutate();
    } catch (err) {
      console.error('Subvendor save error:', err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (typeof err.response?.data === 'string'
          ? err.response.data
          : '❌ Failed to save subvendor. Please try again.');
      toast.error(message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this subvendor?');
    if (!confirmDelete) return;

    const toastId = toast.loading('Deleting subvendor...');
    try {
      await api.deleteSubvendor(id);
      toast.success('🗑️ Subvendor deleted successfully!', { id: toastId });
      mutate();
    } catch (err) {
      console.error('Failed to delete subvendor:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        '❌ Failed to delete subvendor.';
      toast.error(msg, { id: toastId });
    }
  };

  const SkeletonLoader = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse flex space-x-4 border-b py-2">
          <div className="flex-1 h-4 bg-gray-200 rounded"></div>
          <div className="flex-1 h-4 bg-gray-200 rounded"></div>
          <div className="flex-1 h-4 bg-gray-200 rounded"></div>
          <div className="flex-1 h-4 bg-gray-200 rounded"></div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="p-6">
        <Toaster position="top-center" reverseOrder={false} />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Subvendors</h2>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            + Add Subvendor
          </button>
        </div>

        {/* Loading & Error States */}
        {isLoading && <SkeletonLoader />}
        {error && (
          <p className="text-red-500 text-sm">
            ❌ Failed to load subvendors. Please try again later.
          </p>
        )}

        {/* Subvendor Table */}
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          {subs && Array.isArray(subs) && subs.length ? (
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="border-b font-medium bg-gray-50">
                <tr>
                  <th className="py-2 px-3">Business Name</th>
                  <th className="py-2 px-3">Contact Person</th>
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3">Phone</th>
                  <th className="py-2 px-3">Address</th>
                  <th className="py-2 px-3">Created At</th>
                  <th className="py-2 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-2 px-3 font-medium text-gray-900">
                      {s.businessName || '—'}
                    </td>
                    <td className="py-2 px-3">{s.contactPerson || '—'}</td>
                    <td className="py-2 px-3">{s.email || '—'}</td>
                    <td className="py-2 px-3">{s.phone || '—'}</td>
                    <td className="py-2 px-3">{s.address || '—'}</td>
                    <td className="py-2 px-3 text-gray-500">
                      {s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-2 px-3 flex gap-2 justify-center">
                      <button
                        onClick={() => openEditModal(s)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            !isLoading && <p className="text-sm text-gray-500">No subvendors found.</p>
          )}
        </div>

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative animate-fadeIn">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>

              <h3 className="text-lg font-semibold mb-4">
                {editingSub ? 'Edit Subvendor' : 'Add New Subvendor'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  placeholder="Business Name"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleChange}
                  placeholder="Contact Person"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Address"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    editingSub ? 'New Password (optional)' : 'Password (required)'
                  }
                  className="w-full border p-2 rounded"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-2 rounded text-white transition ${
                    submitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submitting
                    ? editingSub
                      ? 'Updating...'
                      : 'Saving...'
                    : editingSub
                    ? 'Update Subvendor'
                    : 'Save Subvendor'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
