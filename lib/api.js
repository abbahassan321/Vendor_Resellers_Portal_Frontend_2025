/* ============================================================
 * GloVendor API Utility (Axios)
 * Role-Aware & Universal Version — FINAL STABLE BUILD
 * Supports: Admin, Aggregator, Subvendor, Retailer, Customer
 * ============================================================
 */
"use client";
import axios from "axios";

/* ============================================================
 * BASE CONFIG
 * ============================================================ */
const BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080").replace(/\/$/, "");
console.log("Backend base URL:", BASE);

/* ============================================================
 * AUTH HELPERS
 * ============================================================ */
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("glovendor_token");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    const userStr = localStorage.getItem("glovendor_user");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function getEmail() {
  const user = getUser();
  return user?.email || null;
}

export function getRole() {
  const user = getUser();
  return user?.role || null;
}

export function getIdentifier() {
  const user = getUser();
  return user?.id || localStorage.getItem("glovendor_identifier");
}

export function saveAuth(token, userObj) {
  if (typeof window === "undefined" || !userObj) return;
  localStorage.setItem("glovendor_token", token);
  localStorage.setItem("glovendor_user", JSON.stringify(userObj));
  localStorage.setItem("glovendor_role", userObj?.role || "");
  localStorage.setItem("glovendor_identifier", userObj?.id || userObj?.email || "");
  axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("glovendor_token");
  localStorage.removeItem("glovendor_user");
  localStorage.removeItem("glovendor_identifier");
  localStorage.removeItem("glovendor_role");
  window.location.href = "/login";
}

/* ============================================================
 * AXIOS INSTANCE
 * ============================================================ */
const axiosInstance = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

/* ============================================================
 * INTERCEPTORS
 * ============================================================ */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error(
      `❌ [${status || "NETWORK"} ERROR]:`,
      typeof data === "string" ? data : JSON.stringify(data)
    );
    if (status === 401 || status === 403) logout();
    return Promise.reject(error);
  }
);

/* ============================================================
 * MAIN API OBJECT
 * ============================================================ */
const GloVendorAPI = {
  /* ---------------- AUTH ---------------- */
  login: async (role, credentials) => {
    let endpoint;
    switch (role?.toUpperCase()) {
      case "AGGREGATOR":
        endpoint = "/api/aggregators/auth/login";
        break;
      case "SUBVENDOR":
        endpoint = "/api/subvendor/auth/login";
        break;
      case "CUSTOMER":
        endpoint = "/api/customer/auth/login";
        break;
      case "RETAILER":
        endpoint = "/api/retailers/auth/login";
        break;
      case "ADMIN":
      case "SUPERADMIN":
        endpoint = "/api/auth/login";
        break;
      default:
        throw new Error("Invalid login role");
    }
    const res = await axiosInstance.post(endpoint, credentials);
    return res.data;
  },

  // ✅ Role-Specific Shortcuts
  adminLogin: async (credentials) => await GloVendorAPI.login("ADMIN", credentials),
  superadminLogin: async (credentials) => await GloVendorAPI.login("SUPERADMIN", credentials),
  aggregatorLogin: async (credentials) => await GloVendorAPI.login("AGGREGATOR", credentials),
  subvendorLogin: async (credentials) => await GloVendorAPI.login("SUBVENDOR", credentials),
  customerLogin: async (credentials) => await GloVendorAPI.login("CUSTOMER", credentials),
  retailerLogin: async (credentials) => await GloVendorAPI.login("RETAILER", credentials),

  /* ---------------- AGGREGATORS ---------------- */
  listAggregators: async () => (await axiosInstance.get("/api/aggregators")).data || [],
  getAggregatorById: async (id) => (await axiosInstance.get(`/api/aggregators/${id}`)).data,

  /* ---------------- SUBVENDORS ---------------- */
  listSubvendors: async () => (await axiosInstance.get("/api/subvendor")).data || [],
  getSubvendorById: async (id) => (await axiosInstance.get(`/api/subvendor/${id}`)).data,
  getSubvendorByEmail: async (email) => {
    if (!email) throw new Error("Email is required to fetch subvendor.");
    const res = await axiosInstance.get(`/api/subvendor/email/${encodeURIComponent(email)}`);
    return res.data;
  },

  /* ---------------- CUSTOMERS ---------------- */
  createCustomer: async (customerData) => {
    if (!customerData) throw new Error("Customer data is required.");
    const res = await axiosInstance.post("/api/customer/add", customerData);
    return res.data;
  },
  listCustomers: async () => (await axiosInstance.get("/api/customer")).data || [],
  getCustomerById: async (id) => (await axiosInstance.get(`/api/customer/${id}`)).data,
  getCustomerByEmail: async (email) => {
    if (!email) throw new Error("Email is required to fetch customer.");
    const res = await axiosInstance.get(`/api/customer/email/${encodeURIComponent(email)}`);
    return res.data;
  },
  getCustomerByMsisdn: async (msisdn) => {
    if (!msisdn) throw new Error("MSISDN is required.");
    const res = await axiosInstance.get(`/api/customer/by-msisdn/${encodeURIComponent(msisdn)}`);
    return res.data;
  },

  /* ---------------- RETAILERS ---------------- */
  createRetailerForSubvendor: async (retailerData) => {
    if (!retailerData) throw new Error("Retailer data is required.");
    const res = await axiosInstance.post("/api/retailers/create", retailerData);
    return res.data;
  },
  listMyRetailers: async () => {
    const res = await axiosInstance.get("/api/retailers/my");
    return res.data;
  },
  getRetailerById: async (id) => {
    const res = await axiosInstance.get(`/api/retailers/${id}`);
    return res.data;
  },
  updateRetailer: async (id, retailerData) => {
    const res = await axiosInstance.put(`/api/retailers/${id}`, retailerData);
    return res.data;
  },
  deleteRetailer: async (id) => {
    const res = await axiosInstance.delete(`/api/retailers/${id}`);
    return res.data;
  },

  /* ---------------- DATA PLANS ---------------- */
  listDataPlans: async () => {
    const res = await axiosInstance.get("/api/data_plans");
    const plans = res.data;
    return Array.isArray(plans)
      ? plans.map((p) => ({
          id: p.id,
          name: p.planName || p.name,
          price: p.priceNaira || p.price || 0,
          validityDays: p.validityDays || p.validity || 0,
          dataServices: p.dataServices,
          ersPlanId: p.ersPlanId,
          newPlan: p.newPlan,
          status: p.status || "INACTIVE",
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }))
      : [];
  },

  /* ---------------- SUBVENDOR DATA PLANS ---------------- */
  listSubvendorDataPlans: async () => {
    const token = getToken();
    if (!token) throw new Error("Please log in first.");
    const user = getUser();
    if (!user) throw new Error("User session not found.");
    if (user.role !== "SUBVENDOR") throw new Error("Only Subvendors can load these plans.");

    let subvendorId = user?.id || getIdentifier();
    if (!subvendorId || isNaN(subvendorId)) {
      if (!user?.email) throw new Error("Email missing for subvendor session.");
      try {
        const sub = await GloVendorAPI.getSubvendorByEmail(user.email);
        subvendorId = sub.id;
        localStorage.setItem("glovendor_identifier", subvendorId);
      } catch (err) {
        console.error("❌ Subvendor lookup failed:", err.message);
        throw new Error("Failed to load subvendor plans. Please re-login.");
      }
    }

    const res = await axiosInstance.get(`/api/subvendor_plans/${subvendorId}`);
    return Array.isArray(res.data) ? res.data : [];
  },

  /* ---------------- PAYMENTS ---------------- */
  initiatePayment: async (data) => (await axiosInstance.post("/api/payments/initiate", data)).data,
  verifyPayment: async (reference) =>
    (await axiosInstance.get(`/api/payments/verify/${encodeURIComponent(reference)}`)).data,

  /* ---------------- WALLET TRANSACTIONS ---------------- */
  listWalletTransactions: async (emailArg) => {
    const user = getUser();
    const email = emailArg || user?.email;
    const role = user?.role;
    if (!email || !role) throw new Error("Missing email or role for wallet lookup.");

    if (["SUPERADMIN", "ADMIN"].includes(role)) {
      const res = await axiosInstance.get("/api/wallet_transactions");
      return Array.isArray(res.data) ? res.data : [];
    }

    const res = await axiosInstance.get(
      `/api/wallet_transactions/email/${encodeURIComponent(email)}`
    );
    return Array.isArray(res.data) ? res.data : [];
  },

  getWalletBalance: async (emailArg, roleArg) => {
    const user = getUser();
    const email = emailArg || user?.email;
    const role = roleArg || user?.role;
    if (!email || !role) throw new Error("Missing email or role for wallet balance lookup.");
    const res = await axiosInstance.get("/api/wallet_transactions/balance", {
      params: { email, role },
    });
    return res.data;
  },

  recordPendingFundingTransaction: async (amount, purpose, paystackResponse) => {
    const user = getUser();
    const email = user?.email;
    const role = user?.role;
    if (!email || !role) throw new Error("User session not found.");

    const res = await axiosInstance.post(
      "/api/wallet_transactions/record-pending",
      paystackResponse || {},
      { params: { email, role, amount, purpose } }
    );
    return res.data;
  },

  markTransactionSuccessful: async (reference) =>
    (await axiosInstance.put(`/api/wallet_transactions/mark-success/${encodeURIComponent(reference)}`)).data,
};

/* ============================================================
 * EXPORT
 * ============================================================ */
const api = Object.assign(axiosInstance, GloVendorAPI);
export default api;
