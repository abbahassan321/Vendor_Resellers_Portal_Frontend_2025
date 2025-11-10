/* ============================================================
 * 🌐 GloVendor API Utility (Axios)
 * Role-Aware & Universal Version — FINAL STABLE BUILD
 * Supports: Admin, Aggregator, Subvendor, Retailer, Customer
 * ============================================================ */
"use client";
import axios from "axios";

/* ============================================================
 * ⚙️ BASE CONFIG
 * ============================================================ */
const BASE = (
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080"
).replace(/\/$/, "");
console.log("✅ Backend base URL:", BASE);

/* ============================================================
 * 🔐 AUTH HELPERS
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
  localStorage.setItem(
    "glovendor_identifier",
    userObj?.id || userObj?.email || ""
  );
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
 * 🧠 AXIOS INSTANCE
 * ============================================================ */
export const axiosInstance = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

/* ============================================================
 * ⚙️ INTERCEPTORS
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
 * 🚀 MAIN API OBJECT
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

  // Role shortcuts
  adminLogin: async (credentials) =>
    await GloVendorAPI.login("ADMIN", credentials),
  superadminLogin: async (credentials) =>
    await GloVendorAPI.login("SUPERADMIN", credentials),
  aggregatorLogin: async (credentials) =>
    await GloVendorAPI.login("AGGREGATOR", credentials),
  subvendorLogin: async (credentials) =>
    await GloVendorAPI.login("SUBVENDOR", credentials),
  customerLogin: async (credentials) =>
    await GloVendorAPI.login("CUSTOMER", credentials),
  retailerLogin: async (credentials) =>
    await GloVendorAPI.login("RETAILER", credentials),

  /* ---------------- AGGREGATORS ---------------- */
  createAggregator: async (aggregatorData) => {
    if (!aggregatorData) throw new Error("Aggregator data is required.");
    const res = await axiosInstance.post(
      "/api/aggregators/add",
      aggregatorData
    );
    return res.data;
  },
  listAggregators: async () =>
    (await axiosInstance.get("/api/aggregators")).data || [],
  getAggregatorById: async (id) =>
    (await axiosInstance.get(`/api/aggregators/${id}`)).data,

  /* ---------------- AGGREGATOR SUBVENDORS ---------------- */
  createSubvendor: async (subvendorData) => {
    if (!subvendorData) throw new Error("Subvendor data is required.");
    // NOTE: backend returns { subvendor, plans } per your controller
    const res = await axiosInstance.post("/api/subvendors/add", subvendorData);
    return res.data;
  },

  /* ---------------- SUBVENDOR LOOKUP ---------------- */
  getSubvendorByEmail: async (email) => {
    try {
      const res = await axiosInstance.get(
        `/api/subvendor_plans/by-email/${email}`
      );
      if (!res.data || !res.data.id) {
        throw new Error("Subvendor not found for email: " + email);
      }
      return res.data;
    } catch (err) {
      console.error(
        "❌ Error fetching subvendor by email:",
        err.response?.data || err.message
      );
      throw new Error(
        err.response?.data?.error || "Failed to fetch subvendor by email."
      );
    }
  },

  listSubvendors: async () => {
    const res = await axiosInstance.get("/api/subvendors");
    return Array.isArray(res.data) ? res.data : [];
  },

  getSubvendorById: async (id) => {
    const res = await axiosInstance.get(`/api/subvendors/${id}`);
    return res.data;
  },

  updateSubvendor: async (id, updatedData) => {
    const res = await axiosInstance.put(`/api/subvendors/${id}`, updatedData);
    return res.data;
  },

  deleteSubvendor: async (id) => {
    await axiosInstance.delete(`/api/subvendors/${id}`);
    return { success: true };
  },

  /* ---------------- ADMINS ---------------- */
  getAdminById: async (id) => {
    const res = await fetch(`/api/admins/${id}`);
    if (!res.ok) throw new Error("Failed to fetch admin");
    return res.json();
  },

  /* ---------------- CUSTOMERS ---------------- */
  createCustomer: async (customerData) => {
    if (!customerData) throw new Error("Customer data is required.");
    const res = await axiosInstance.post("/api/customer/add", customerData);
    return res.data;
  },
  listCustomers: async () =>
    (await axiosInstance.get("/api/customer")).data || [],
  getCustomerById: async (id) =>
    (await axiosInstance.get(`/api/customer/${id}`)).data,
  getCustomerByEmail: async (email) => {
    if (!email) throw new Error("Email is required to fetch customer.");
    const res = await axiosInstance.get(
      `/api/customer/email/${encodeURIComponent(email)}`
    );
    return res.data;
  },
  getCustomerByMsisdn: async (msisdn) => {
    if (!msisdn) throw new Error("MSISDN is required.");
    const res = await axiosInstance.get(
      `/api/customer/by-msisdn/${encodeURIComponent(msisdn)}`
    );
    return res.data;
  },

  /* ---------------- RETAILERS ---------------- */
  createRetailerForSubvendor: async (retailerData) => {
    if (!retailerData) throw new Error("Retailer data is required.");
    const res = await axiosInstance.post("/api/retailers/create", retailerData);
    return res.data;
  },
  listMyRetailers: async () =>
    (await axiosInstance.get("/api/retailers/my")).data,
  getRetailerById: async (id) =>
    (await axiosInstance.get(`/api/retailers/${id}`)).data,

  updateRetailer: async (id, retailerData) =>
    (await axiosInstance.put(`/api/retailers/${id}`, retailerData)).data,
  deleteRetailer: async (id) =>
    (await axiosInstance.delete(`/api/retailers/${id}`)).data,

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

  /* ---------------- UPLOAD DATA PLANS ---------------- */
  uploadDataPlans: async (file, uploadedBy) => {
    if (!file) throw new Error("No file selected for upload");

    const formData = new FormData();
    formData.append("file", file);
    if (uploadedBy) formData.append("uploadedBy", uploadedBy);

    const res = await axiosInstance.post("/api/data_plans/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  },

  /* ---------------- SUBVENDOR DATA PLANS ---------------- */
  listSubvendorDataPlans: async () => {
    const token = getToken();
    if (!token) throw new Error("Please log in first.");

    const user = getUser();
    if (!user) throw new Error("User session not found.");
    if (user.role?.toUpperCase() !== "SUBVENDOR")
      throw new Error("Only Subvendors can access their plans.");

    // ✅ Try cached subvendor ID or fallback to user.id
    let subvendorId = localStorage.getItem("glovendor_identifier") || user?.id;

    // ✅ Lookup subvendor by email if ID is missing or invalid
    if (!subvendorId || isNaN(subvendorId)) {
      if (!user?.email) throw new Error("Email missing for subvendor session.");

      try {
        console.log("🔍 Fetching subvendor ID by email...");
        const sub = await GloVendorAPI.getSubvendorByEmail(user.email);

        if (!sub || !sub.id)
          throw new Error("No subvendor record found for this account.");

        subvendorId = sub.id;
        localStorage.setItem("glovendor_identifier", subvendorId);
      } catch (err) {
        console.error("❌ Subvendor lookup failed:", err.message);
        throw new Error("Failed to identify subvendor. Please re-login.");
      }
    }

    // ✅ Ensure the ID is valid before request
    if (!subvendorId || isNaN(subvendorId)) {
      throw new Error("Invalid Subvendor ID detected. Please re-login.");
    }

    // ✅ Fetch the data plans for that subvendor
    try {
      console.log(`📡 Fetching data plans for Subvendor ID: ${subvendorId}`);
      const res = await axiosInstance.get(
        `/api/subvendor_plans/${subvendorId}`
      );

      if (!res.data || res.status !== 200)
        throw new Error("Invalid response from server.");

      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error(
        "❌ Error loading subvendor data plans:",
        err.response?.data || err.message
      );
      throw new Error(
        err.response?.data?.error ||
          "Unable to fetch subvendor plans. Please try again later."
      );
    }
  },

  // ✅ Update custom price for a single subvendor data plan
  updateSubvendorDataPlan: async (planId, payload) => {
    const token = getToken();
    if (!token) throw new Error("Please log in first.");

    try {
      const res = await axiosInstance.patch(
        `/api/subvendor_plans/${planId}`,
        payload
      );
      return res.data;
    } catch (err) {
      console.error(
        "❌ Failed to update data plan:",
        err.response?.data || err.message
      );
      throw new Error(
        err.response?.data?.error || "Update failed. Please try again."
      );
    }
  },

  // ✅ Delete a subvendor data plan
  deleteSubvendorDataPlan: async (planId) => {
    const token = getToken();
    if (!token) throw new Error("Please log in first.");

    try {
      await axiosInstance.delete(`/api/subvendor_plans/${planId}`);
      return true;
    } catch (err) {
      console.error(
        "❌ Failed to delete plan:",
        err.response?.data || err.message
      );
      throw new Error("Unable to delete plan. Please try again.");
    }
  },

  /* ---------------- PAYMENTS ---------------- */
  initiatePayment: async (data) =>
    (await axiosInstance.post("/api/payments/initiate", data)).data,
  verifyPayment: async (reference) =>
    (
      await axiosInstance.get(
        `/api/payments/verify/${encodeURIComponent(reference)}`
      )
    ).data,

  /* ============================================================
   * 🧾 LIST WALLET TRANSACTIONS (role-aware, safe)
   * ============================================================ */
  listWalletTransactions: async (
    userIdArg = null,
    emailArg = null,
    roleArg = null
  ) => {
    try {
      // Try explicit args first
      const userFromGetter = (() => {
        try {
          return getUser();
        } catch {
          return null;
        }
      })();

      const email =
        emailArg ||
        userFromGetter?.email ||
        (typeof window !== "undefined"
          ? localStorage.getItem("user_email")
          : null);
      const roleRaw =
        roleArg ||
        userFromGetter?.role ||
        (typeof window !== "undefined"
          ? localStorage.getItem("glovendor_role")
          : null);
      const role = roleRaw ? String(roleRaw).toUpperCase() : null;

      // If still missing role, don't throw — return empty array and log. This avoids SWR unhandled exceptions.
      if (!role) {
        console.warn(
          "api.listWalletTransactions: Role not available yet; skipping fetch and returning []."
        );
        return [];
      }

      // Admin / Superadmin -> fetch all
      if (["ADMIN", "SUPERADMIN"].includes(role)) {
        const res = await axiosInstance.get("/api/wallet_transactions");
        return Array.isArray(res.data) ? res.data : [];
      }

      // Normal users -> fetch by email & role query params
      if (!email) {
        console.warn(
          "api.listWalletTransactions: email missing for non-admin role; returning []."
        );
        return [];
      }

      const res = await axiosInstance.get("/api/wallet_transactions/user", {
        params: { email, role },
      });

      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      // Keep errors non-throwing for SWR; log for debugging.
      console.error("❌ Failed to load wallet transactions:", err);
      return [];
    }
  },

  getWalletBalance: async (emailArg, roleArg) => {
    const user = getUser();
    const email = emailArg || user?.email;
    const role = roleArg || user?.role;

    if (!email || !role)
      throw new Error("Missing email or role for wallet balance lookup.");

    const res = await axiosInstance.get("/api/wallet_transactions/balance", {
      params: { email, role },
    });

    return res.data;
  },

  recordPendingFundingTransaction: async (
    amount,
    purpose,
    paystackResponse
  ) => {
    const user = getUser();
    const email = user?.email;
    const role = user?.role;
    if (!email || !role) throw new Error("User session not found.");

    const res = await axiosInstance.post(
      "/api/wallet_transactions/record-pending",
      paystackResponse || {},
      {
        params: { email, role, amount, purpose },
      }
    );
    return res.data;
  },

  markTransactionSuccessful: async (reference) =>
    (
      await axiosInstance.put(
        `/api/wallet_transactions/mark-success/${encodeURIComponent(reference)}`
      )
    ).data,
};

/* ============================================================
 * 📦 EXPORT
 * ============================================================ */
const api = Object.assign(axiosInstance, GloVendorAPI);
export default api;
