// components/AdminComponents/WalletTransactions.jsx
"use client";

import useSWR from "swr";
import { useEffect, useState, useMemo } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api, { getToken, getUser } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function WalletTransactions() {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // load user on client (ensures role is available)
  useEffect(() => {
    const u = getUser();
    if (u) {
      setUser(u);
      setIsReady(true);
      return;
    }

    // fallback: try localStorage
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        setIsReady(true);
      }
    } catch {
      // no-op
    }
  }, []);

  const role = user?.role?.toUpperCase();
  const isAdmin = ["ADMIN", "SUPERADMIN"].includes(role);
  const swrKey = isReady ? ["wallet_txns", role || ""] : null;

  const { data: txns = [], error, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      // call api.listWalletTransactions (it will handle admin or normal user)
      return await api.listWalletTransactions();
    },
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    }
  );

  useEffect(() => {
    if (error) toast.error("⚠️ Failed to load wallet transactions");
  }, [error]);

  const SkeletonRow = () => (
    <tr className="animate-pulse border-t">
      {Array.from({ length: isAdmin ? 10 : 6 }).map((_, i) => (
        <td key={i} className="p-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  );

  const columns = useMemo(() => {
    if (isAdmin) {
      return [
        "Reference",
        "User ID",
        "Email",
        "Amount (₦)",
        "Txn Type",
        "Status",
        "Role",
        "Balance Before",
        "Balance After",
        "Created At",
      ];
    } else {
      return ["Reference", "Amount (₦)", "Txn Type", "Status", "Created At"];
    }
  }, [isAdmin]);

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "AGGREGATOR", "SUBVENDOR", "CUSTOMER"]}>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Wallet Transactions</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => mutate()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <RefreshCcw size={16} /> Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead>
              <tr className="text-left bg-gray-100 border-b">
                {columns.map((col) => (
                  <th key={col} className="p-3 font-medium text-gray-700">{col}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

              {!isLoading && error && (
                <tr>
                  <td colSpan={columns.length} className="p-6 text-center text-red-600 font-medium">
                    Failed to load transactions. Please check your connection or backend.
                  </td>
                </tr>
              )}

              {!isLoading && !error && txns && txns.length > 0 && txns.map((t) => (
                <tr key={t.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-medium text-gray-800">{t.reference || "-"}</td>
                  {isAdmin && (
                    <>
                      <td className="p-3 text-gray-700">{t.userId || "-"}</td>
                      <td className="p-3 text-gray-700">{t.email || "-"}</td>
                    </>
                  )}
                  <td className="p-3 text-gray-700">{Number(t.amount)?.toLocaleString() || "-"}</td>
                  <td className="p-3 text-gray-700">{t.txnType || "-"}</td>
                  <td className="p-3">
                    {t.status === "SUCCESS" || t.status === "COMPLETED" ? (
                      <span className="text-green-600 font-semibold">{t.status}</span>
                    ) : t.status === "FAILED" ? (
                      <span className="text-red-600 font-semibold">{t.status}</span>
                    ) : (
                      <span className="text-yellow-600 font-semibold">{t.status}</span>
                    )}
                  </td>
                  {isAdmin && (
                    <>
                      <td className="p-3 text-gray-700">{t.role || "-"}</td>
                      <td className="p-3 text-gray-700">{t.balanceBefore ?? "-"}</td>
                      <td className="p-3 text-gray-700">{t.balanceAfter ?? "-"}</td>
                    </>
                  )}
                  <td className="p-3 text-gray-700">{t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"}</td>
                </tr>
              ))}

              {!isLoading && !error && (!txns || txns.length === 0) && (
                <tr>
                  <td colSpan={columns.length} className="p-6 text-center text-gray-500">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>

          {isLoading && (
            <div className="flex justify-center items-center p-6 text-gray-600">
              <Loader2 className="animate-spin mr-2" size={18} /> Loading...
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
