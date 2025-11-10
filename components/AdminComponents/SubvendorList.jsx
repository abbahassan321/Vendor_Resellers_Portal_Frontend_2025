'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Loader2, RefreshCcw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

/**
 * 🧩 Admin Subvendor List Page
 * Fetches and displays all subvendors with search, filter, and real-time updates.
 */
export default function SubvendorList() {
  const previousSubsRef = useRef([]);

  // ✅ SWR data fetching with auto-refresh every 5 seconds for more real-time updates
  const { data: subs, error, isLoading, mutate } = useSWR(
    'subvendors',
    async () => {
      return await api.listSubvendors();
    },
    { refreshInterval: 5000 } // fetch every 5 seconds
  );

  // Compare old vs new data for notifications
  useEffect(() => {
    if (!subs || !Array.isArray(subs)) return;
    const previousSubs = previousSubsRef.current;
    if (previousSubs.length < subs.length) {
      // Find newly added subvendors
      const newSubs = subs.filter(
        (s) => !previousSubs.some((p) => p.id === s.id)
      );
      newSubs.forEach((s) =>
        toast.success(`New subvendor added: ${s.businessName}`)
      );
    }
    previousSubsRef.current = subs;
  }, [subs]);

  // ✅ State for search/filter
  const [filterField, setFilterField] = useState('businessName');
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Filtered subvendors based on search
  const filteredSubs = useMemo(() => {
    if (!subs || !Array.isArray(subs)) return [];
    if (!searchTerm) return subs;

    return subs.filter((s) => {
      const value = String(s[filterField] || '').toLowerCase();
      return value.includes(searchTerm.toLowerCase());
    });
  }, [subs, searchTerm, filterField]);

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="p-6 space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Subvendors</h2>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>

        {/* 🔍 Search and Filter */}
        <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-4 rounded-lg shadow-sm">
          <select
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="businessName">Business Name</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="contactPerson">Contact Person</option>
          </select>

          <input
            type="text"
            placeholder={`Search by ${filterField
              .replace(/([A-Z])/g, ' $1')
              .toLowerCase()}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-64 text-sm"
          />
        </div>

        {/* 🌀 Loading */}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="animate-spin" size={16} /> Loading subvendors...
          </div>
        )}

        {/* ❌ Error */}
        {error && (
          <div className="text-red-500 text-sm">
            Failed to load subvendors. Please try again later.
          </div>
        )}

        {/* ✅ Table Display */}
        {!isLoading && !error && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            {filteredSubs.length > 0 ? (
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="border-b font-medium bg-gray-50">
                  <tr>
                    <th className="py-2 px-3">#ID</th>
                    <th className="py-2 px-3">Business Name</th>
                    <th className="py-2 px-3">Contact Person</th>
                    <th className="py-2 px-3">Email</th>
                    <th className="py-2 px-3">Phone</th>
                    <th className="py-2 px-3">Address</th>
                    <th className="py-2 px-3">Wallet</th>
                    <th className="py-2 px-3">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((s, i) => (
                    <tr
                      key={s.id || i}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2 px-3 text-gray-700">{s.id || '—'}</td>
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {s.businessName || '—'}
                      </td>
                      <td className="py-2 px-3">{s.contactPerson?.trim() || '—'}</td>
                      <td className="py-2 px-3">{s.email || '—'}</td>
                      <td className="py-2 px-3">{s.phone || '—'}</td>
                      <td className="py-2 px-3">{s.address || '—'}</td>
                      <td className="py-2 px-3 text-gray-700">
                        ₦{s.walletBalance?.toLocaleString() || '0.00'}
                      </td>
                      <td className="py-2 px-3 text-gray-500">
                        {s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-gray-500 p-4">No subvendors found.</div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
