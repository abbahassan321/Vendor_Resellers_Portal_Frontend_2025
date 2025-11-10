"use client";

import { useState, useEffect } from "react";
import api, { getToken } from "@/lib/api";
import toast, { Toaster } from "react-hot-toast";

export default function PaymentForm({ onWalletUpdate }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  /* ============================================================
   * Load Logged-In User
   * ============================================================ */
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const storedRole = localStorage.getItem("glovendor_role");

    if (!userStr || !storedRole) {
      toast.error("⚠️ Please log in to continue.");
      setTimeout(() => (window.location.href = "/login"), 1500);
      return;
    }

    const userObj = JSON.parse(userStr);
    if (!userObj.email) {
      toast.error("⚠️ User session is invalid.");
      setTimeout(() => (window.location.href = "/login"), 1500);
      return;
    }

    setEmail(userObj.email);
    setRole(storedRole);
    fetchWalletBalance(userObj.email, storedRole);
  }, []);

  /* ============================================================
   * Fetch Wallet Balance
   * ============================================================ */
  const fetchWalletBalance = async (email, role) => {
    if (!email || !role) return;
    try {
      const token = getToken();
      const res = await api.get("/api/wallet_transactions/balance", {
        headers: { Authorization: `Bearer ${token}` },
        params: { email, role }, // <-- pass as query params
      });
      const newBalance = res?.data?.balance ?? 0;
      setBalance(newBalance);
      if (onWalletUpdate) onWalletUpdate(newBalance);
    } catch (err) {
      console.error("❌ Wallet fetch failed:", err.response || err);
      toast.error("❌ Failed to load wallet balance.");
    }
  };

  /* ============================================================
   * Handle Payment (Paystack Init)
   * ============================================================ */
  const initiatePayment = async (e) => {
    e.preventDefault();

    if (!email || !role) {
      toast.error("❌ Missing user session. Please log in again.");
      return;
    }

    if (!amount || parseFloat(amount) < 100) {
      toast.error("❌ Enter an amount of at least ₦100.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("⏳ Initializing payment...");

    try {
      const token = getToken();
      const payload = {
        email,
        amount: parseFloat(amount),
        role,
      };

      const res = await api.post("/api/payments/initiate", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const authUrl = res?.data?.data?.authorization_url;
      const reference = res?.data?.data?.reference;

      if (authUrl && reference) {
        localStorage.setItem("payment_reference", reference);
        toast.success("✅ Redirecting to Paystack...", { id: toastId });
        window.location.href = authUrl;
      } else {
        toast.error("❌ Could not generate payment link", { id: toastId });
      }
    } catch (err) {
      console.error("❌ Payment initiation error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "An unknown error occurred.";
      toast.error(`❌ Payment initiation failed: ${msg}`, { id: toastId });
    } finally {
      setLoading(false);
      setTimeout(() => fetchWalletBalance(email, role), 5000);
    }
  };

  /* ============================================================
   * UI
   * ============================================================ */
  if (!email)
    return (
      <div className="flex justify-center items-center h-48 text-gray-600">
        Loading session...
      </div>
    );

  return (
    <div className="max-w-md mx-auto">
      <Toaster position="top-center" />
      <h2 className="text-2xl font-semibold mb-4 text-center">
        💳 Fund Wallet
      </h2>

      <div className="mb-4 p-3 rounded text-white text-sm bg-blue-600 text-center">
        Current Balance: ₦{balance.toLocaleString()}
      </div>

      <form
        onSubmit={initiatePayment}
        className="bg-white shadow rounded-lg p-6 space-y-4"
      >
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full border border-gray-300 bg-gray-100 rounded-lg px-3 py-2 text-gray-600 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Amount (₦)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
            required
            min="100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white font-medium transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </form>
    </div>
  );
}
