"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import api, { getToken } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function SubvendorDataPlan() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [profitPreview, setProfitPreview] = useState(0);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [margin, setMargin] = useState("");
  const [applyingMargin, setApplyingMargin] = useState(false);
  const [avgPrice, setAvgPrice] = useState(null);
  const [warning, setWarning] = useState("");
  const [subvendorId, setSubvendorId] = useState(null);

  // Load subvendor ID
  useEffect(() => {
    if (typeof window !== "undefined") {
      const id =
        localStorage.getItem("glovendor_identifier") ||
        localStorage.getItem("subvendorId");
      setSubvendorId(id);
    }
  }, []);

  // SWR fetcher
  const fetcher = async () => {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");
    if (!subvendorId) throw new Error("Missing subvendor ID");

    const res = await api.get(`/api/subvendor_plans/${subvendorId}`);
    return res.data;
  };

  const { data: plans, error, isLoading, mutate } = useSWR(
    subvendorId ? `subvendor_plans_${subvendorId}` : null,
    fetcher
  );

  // Fetch co-vendor average price
  const fetchCoVendorAverage = async (planId) => {
    try {
      const res = await api.get(
        `/api/subvendor_plans/${planId}/co-vendor-stats?currentSubvendorId=${subvendorId}`
      );
      setAvgPrice(res.data.avgPrice || 0);
    } catch (err) {
      console.error("Error fetching co-vendor average:", err);
      setAvgPrice(0);
    }
  };

  // Price warning
  const checkPriceDifference = (enteredPrice) => {
    if (!avgPrice) return;
    const diffPercent = ((enteredPrice - avgPrice) / avgPrice) * 100;
    setWarning(
      diffPercent > 15
        ? "⚠️ Your price is significantly higher; you may lose customers."
        : ""
    );
  };

  // Update single plan
  const handlePriceUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!newPrice || isNaN(newPrice))
      return setMsg("❌ Please enter a valid price");

    setSubmitting(true);
    setMsg("");

    try {
      const res = await api.patch(`/api/subvendor_plans/${selectedPlan.id}`, {
        customPrice: parseFloat(newPrice),
      });

      const updatedPlan = res.data;
      setMsg("✅ Price updated successfully!");

      // Update SWR cache locally
      mutate(
        plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)),
        false
      );
      setSelectedPlan({ ...selectedPlan, customPrice: updatedPlan.customPrice });
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to update price. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Apply global margin
  const handleApplyMargin = async () => {
    if (!margin || isNaN(margin)) return setMsg("❌ Enter a valid percentage");
    if (!subvendorId) return setMsg("❌ Missing subvendor ID");

    setApplyingMargin(true);
    setMsg("");

    try {
      const percent = parseFloat(margin);

      const res = await api.post(`/api/subvendors/${subvendorId}/apply-margin`, {
        margin: percent,
      });

      // Update SWR cache instantly with new prices
      const updatedPlans = plans.map((plan) => {
        const newPriceWithMargin =
          Number(plan.basePrice) * (1 + percent / 100);
        return {
          ...plan,
          priceWithMargin: newPriceWithMargin,
          profit: newPriceWithMargin - Number(plan.basePrice),
          marginPercent: percent,
        };
      });
      mutate(updatedPlans, false);

      setMsg(`✅ Applied ${percent}% margin to all plans successfully!`);
      setMargin("");
    } catch (err) {
      console.error("Apply margin error:", err.response || err);
      if (err.response?.data?.error) {
        setMsg(`❌ Failed to apply margin: ${err.response.data.error}`);
      } else {
        setMsg("❌ Failed to apply margin. Try again.");
      }
    } finally {
      setApplyingMargin(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto mt-10 px-4">
        <h2 className="text-2xl font-semibold mb-6">📡 My Data Plans</h2>

        {msg && (
          <p
            className={`mb-4 text-sm ${
              msg.includes("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {msg}
          </p>
        )}

        {/* Apply Margin Section */}
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
              className="border rounded p-2 w-44"
            />
            <button
              onClick={handleApplyMargin}
              disabled={applyingMargin}
              className={`px-4 py-2 rounded text-white ${
                applyingMargin
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {applyingMargin ? "Applying..." : "Apply Margin"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This updates all custom prices = base price × (1 + margin / 100)
          </p>
        </div>

        {/* Data Plans Table */}
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
                  <th className="p-2">Network</th>
                  <th className="p-2">Base Price (₦)</th>
                  <th className="p-2 bg-blue-50 text-blue-800 font-semibold">
                    Custom Price (₦)
                  </th>
                  <th className="p-2">Profit (₦)</th>
                  <th className="p-2">Validity (days)</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Created At</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {plans && plans.length > 0 ? (
                  plans.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{p.name}</td>
                      <td className="p-2">{p.dataServices || "-"}</td>
                      <td className="p-2">{Number(p.basePrice)?.toFixed(2)}</td>
                      <td className="p-2 font-semibold text-blue-800">
                        {Number(p.priceWithMargin)?.toFixed(2)}
                      </td>
                      <td className="p-2 font-semibold text-green-600">
                        {Number(p.profit)?.toFixed(2)}
                      </td>
                      <td className="p-2">{p.validityDays ?? "-"}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            p.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-2">
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => {
                            setSelectedPlan(p);
                            setProfitPreview(Number(p.profit));
                            fetchCoVendorAverage(p.id);
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
                    <td className="p-4 text-center text-gray-500" colSpan={9}>
                      No data plans available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Update Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setWarning("");
                  setAvgPrice(null);
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>

              <h3 className="text-lg font-semibold mb-3">
                Update Custom Price
              </h3>
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
                    const val = parseFloat(e.target.value);
                    setNewPrice(e.target.value);
                    checkPriceDifference(val);
                    setProfitPreview(val - Number(selectedPlan.basePrice));
                  }}
                  className="w-full border rounded p-2"
                  required
                />
                {warning && (
                  <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-300 rounded p-2">
                    {warning}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Profit Preview: ₦{profitPreview.toFixed(2)}
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-2 rounded text-white transition ${
                    submitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {submitting ? "Updating..." : "Save Price"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
