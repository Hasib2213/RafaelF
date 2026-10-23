import {
  User,
  LoginResponse,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  VerifyOtpPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
} from "./types/auth";

export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8055").trim();

const ACCESS_TOKEN_KEY = "curio_access_token";
const REFRESH_TOKEN_KEY = "curio_refresh_token";
const USER_KEY = "curio_user";

// Token storage helpers
export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// Resolve avatar URL whether it's absolute, relative (/media/...), Cloudinary, or blob
export const resolveAvatarUrl = (url?: string | null): string => {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) {
    return `${API_BASE_URL}${trimmed}`;
  }
  return `${API_BASE_URL}/${trimmed}`;
};

// Normalize User object so both avatar and avatar_url contain full valid URLs
export const normalizeUser = (user: User | null | undefined): User | null => {
  if (!user) return null;
  const rawAvatar = user.avatar_url || user.avatar || null;
  const resolved = rawAvatar ? resolveAvatarUrl(rawAvatar) : "";
  return {
    ...user,
    avatar: resolved || user.avatar || null,
    avatar_url: resolved || user.avatar_url || undefined,
  };
};

export const setAuthSession = (tokens: { access: string; refresh: string }, user?: User) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  if (user) {
    const normalized = normalizeUser(user) || user;
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
  }
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("curio_admin_user");
};

export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as User;
    return normalizeUser(parsed);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User) => {
  if (typeof window === "undefined") return;
  const normalized = normalizeUser(user) || user;
  localStorage.setItem(USER_KEY, JSON.stringify(normalized));
};

// API Error class
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Format Django REST Framework error response to human-readable string
export function parseDjangoError(errData: any, defaultMsg = "An error occurred"): string {
  if (!errData) return defaultMsg;
  if (typeof errData === "string") {
    if (errData.includes("<!DOCTYPE html>") || errData.includes("<html")) {
      return defaultMsg;
    }
    return errData;
  }
  if (errData.detail && typeof errData.detail === "string") return errData.detail;
  if (errData.message && typeof errData.message === "string") return errData.message;

  if (errData.non_field_errors && Array.isArray(errData.non_field_errors)) {
    return errData.non_field_errors.join(" ");
  }

  // Handle field errors: { email: ["This field is required."], password: [...] }
  if (typeof errData === "object") {
    const errorMessages: string[] = [];
    for (const [key, value] of Object.entries(errData)) {
      const fieldName = key.replace(/_/g, " ");
      if (Array.isArray(value)) {
        errorMessages.push(`${fieldName}: ${value.join(" ")}`);
      } else if (typeof value === "string") {
        errorMessages.push(`${fieldName}: ${value}`);
      }
    }
    if (errorMessages.length > 0) {
      return errorMessages.join(" | ");
    }
  }

  return defaultMsg;
}

// In-flight refresh token promise to prevent duplicate refresh calls
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearAuthSession();
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      clearAuthSession();
      return null;
    }

    const data = await response.json();
    if (data.access) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      if (data.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
      }
      return data.access;
    }
    return null;
  } catch {
    clearAuthSession();
    return null;
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  cacheTtl?: number; // In seconds. Only applies to GET requests
  swr?: boolean; // Enable Stale-While-Revalidate (default: true when cacheTtl is provided)
}

// Client-side in-memory cache and in-flight request deduplication
interface ClientCacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}
const clientMemoryCache = new Map<string, ClientCacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

export function invalidateClientCache(prefix?: string): void {
  if (!prefix) {
    clientMemoryCache.clear();
    return;
  }
  for (const key of clientMemoryCache.keys()) {
    if (key.includes(prefix)) {
      clientMemoryCache.delete(key);
    }
  }
}

// Automatically purge relevant client cache entries when any mutation occurs
export function autoInvalidateOnMutation(endpoint: string, method: string): void {
  if (method === "GET") return;

  const clean = endpoint.toLowerCase();
  if (clean.includes("/api/auth/profile")) {
    invalidateClientCache("/api/auth/profile");
  }
  if (clean.includes("/api/briefings")) {
    invalidateClientCache("/api/briefings");
    invalidateClientCache("/api/analytics/dashboard");
  }
  if (clean.includes("/api/creators")) {
    invalidateClientCache("/api/creators");
  }
  if (clean.includes("/api/library")) {
    invalidateClientCache("/api/library");
  }
  if (clean.includes("/api/auth/notifications")) {
    invalidateClientCache("/api/auth/notifications");
  }
  if (clean.includes("/api/feedback")) {
    invalidateClientCache("/api/feedback");
    invalidateClientCache("/api/analytics/dashboard");
  }
  if (clean.includes("/api/subscriptions")) {
    invalidateClientCache("/api/subscriptions");
    invalidateClientCache("/api/analytics/dashboard");
  }
  if (clean.includes("/api/settings")) {
    invalidateClientCache("/api/settings");
  }
  if (clean.includes("/api/auth/admin/users") || clean.includes("/api/auth/register")) {
    invalidateClientCache("/api/auth/admin/users");
    invalidateClientCache("/api/analytics/dashboard");
    invalidateClientCache("/api/analytics/user-locations");
  }
  if (clean.includes("/api/analytics")) {
    invalidateClientCache("/api/analytics");
  }
}

// Core fetch wrapper with SWR (Stale-While-Revalidate) & ngrok warning bypass
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, cacheTtl, swr = true, headers = {}, ...restOptions } = options;
  const method = (restOptions.method || "GET").toUpperCase();

  let url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  // Automatically append ngrok bypass query param for ngrok URLs
  if (url.includes("ngrok") && !url.includes("ngrok-skip-browser-warning")) {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}ngrok-skip-browser-warning=true`;
  }

  const cacheKey = `${method}:${url}`;

  // Stale-While-Revalidate (SWR) cache check for GET requests
  if (cacheTtl && method === "GET") {
    const cached = clientMemoryCache.get(cacheKey);
    const now = Date.now();

    if (cached) {
      // 1. Fresh cache HIT -> 0ms instant response
      if (now < cached.expiry) {
        return cached.data as T;
      }

      // 2. Stale cache HIT -> Return cached data immediately, revalidate silently in background!
      if (swr) {
        if (!inFlightRequests.has(cacheKey)) {
          const backgroundRevalidation = executeFetch()
            .then((freshData) => {
              clientMemoryCache.set(cacheKey, {
                data: freshData,
                timestamp: Date.now(),
                expiry: Date.now() + cacheTtl * 1000,
              });
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("curio_cache_updated", {
                    detail: { key: cacheKey, data: freshData },
                  })
                );
              }
              return freshData;
            })
            .catch((err) => {
              console.warn(`[SWR Revalidation Notice] ${url}:`, err?.message || err);
            })
            .finally(() => {
              inFlightRequests.delete(cacheKey);
            });

          inFlightRequests.set(cacheKey, backgroundRevalidation);
        }

        return cached.data as T;
      }
    }

    // Deduplicate in-flight requests
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey) as Promise<T>;
    }
  }

  async function executeFetch(): Promise<T> {
    const requestHeaders = new Headers(headers);

    // Bypass ngrok free browser warning page for API calls
    if (!requestHeaders.has("ngrok-skip-browser-warning")) {
      requestHeaders.set("ngrok-skip-browser-warning", "true");
    }

    // If not FormData, default to application/json
    if (!(restOptions.body instanceof FormData) && !requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }

    // Attach token if needed
    if (!skipAuth) {
      let token = getAccessToken();
      if (
        typeof window !== "undefined" &&
        (endpoint.includes("/admin/") || window.location.pathname.startsWith("/admin"))
      ) {
        const adminToken = localStorage.getItem("curio_admin_token");
        if (adminToken) {
          token = adminToken;
        }
      }
      if (token) {
        requestHeaders.set("Authorization", `Bearer ${token}`);
      }
    }

    let response = await fetch(url, {
      cache: restOptions.cache ?? "no-store",
      ...restOptions,
      headers: requestHeaders,
    });

    // Handle 401 Unauthorized (attempt refresh)
    if (response.status === 401 && !skipAuth) {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        requestHeaders.set("Authorization", `Bearer ${newAccessToken}`);
        response = await fetch(url, {
          cache: restOptions.cache ?? "no-store",
          ...restOptions,
          headers: requestHeaders,
        });
      }
    }

    // Parse response
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = parseDjangoError(data, `Request failed with status ${response.status}`);
      const cleanData =
        typeof data === "string" && (data.includes("<!DOCTYPE html>") || data.includes("<html"))
          ? { detail: message }
          : data;
      throw new ApiError(message, response.status, cleanData);
    }

    // Store in client memory cache if TTL configured
    if (cacheTtl && method === "GET") {
      clientMemoryCache.set(cacheKey, {
        data: data as T,
        timestamp: Date.now(),
        expiry: Date.now() + cacheTtl * 1000,
      });
    }

    // Automatic client cache invalidation on any mutations (POST, PUT, PATCH, DELETE)
    if (method !== "GET") {
      autoInvalidateOnMutation(endpoint, method);
    }

    return data as T;
  }

  if (cacheTtl && method === "GET") {
    const fetchPromise = executeFetch().finally(() => {
      inFlightRequests.delete(cacheKey);
    });
    inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  return executeFetch();
}

// Auth API endpoints
export const authApi = {
  // Login
  login: async (credentials: LoginPayload): Promise<LoginResponse> => {
    const payload = {
      ...credentials,
      email: credentials.email ? credentials.email.trim().toLowerCase() : "",
    };
    const res = await apiClient<LoginResponse>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    const normalizedUser = normalizeUser(res.user) || res.user;
    setAuthSession({ access: res.access, refresh: res.refresh }, normalizedUser);
    return { ...res, user: normalizedUser };
  },

  // Register
  register: async (
    payload: RegisterPayload
  ): Promise<{ message: string; user: User }> => {
    const cleanPayload = {
      ...payload,
      email: payload.email ? payload.email.trim().toLowerCase() : "",
      first_name: payload.first_name?.trim() || "",
      last_name: payload.last_name?.trim() || "",
    };
    const res = await apiClient<{ message: string; user: User }>("/api/auth/register/", {
      method: "POST",
      body: JSON.stringify(cleanPayload),
      skipAuth: true,
    });
    if (res && res.user) {
      res.user = normalizeUser(res.user) || res.user;
    }
    return res;
  },

  // Get current user profile
  getProfile: async (skipCache: boolean = false): Promise<User> => {
    if (skipCache) {
      invalidateClientCache("/api/auth/profile/");
    }
    const user = await apiClient<User>("/api/auth/profile/", {
      method: "GET",
      cacheTtl: skipCache ? undefined : 1800,
    });
    const normalized = normalizeUser(user) || user;
    setStoredUser(normalized);
    return normalized;
  },

  // Update profile
  updateProfile: async (data: Partial<User> | FormData): Promise<User> => {
    const isFormData = data instanceof FormData;
    const updated = await apiClient<User>("/api/auth/profile/", {
      method: "PATCH",
      body: isFormData ? data : JSON.stringify(data),
    });
    invalidateClientCache("/api/auth/profile");
    const normalized = normalizeUser(updated) || updated;
    setStoredUser(normalized);
    return normalized;
  },

  // Change password
  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    const res = await apiClient<{ message: string }>("/api/auth/change-password/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    invalidateClientCache("/api/auth/profile");
    return res;
  },

  // Forgot password (request OTP)
  forgotPassword: async (
    payload: ForgotPasswordPayload
  ): Promise<{ message: string; email: string; otp?: string; expires_in_minutes: number }> => {
    const clean = {
      ...payload,
      email: payload.email ? payload.email.trim().toLowerCase() : "",
    };
    return apiClient("/api/auth/forgot-password/", {
      method: "POST",
      body: JSON.stringify(clean),
      skipAuth: true,
    });
  },

  // Verify OTP
  verifyOtp: async (
    payload: VerifyOtpPayload
  ): Promise<{ message: string; valid?: boolean }> => {
    const clean = {
      ...payload,
      email: payload.email ? payload.email.trim().toLowerCase() : "",
    };
    return apiClient("/api/auth/verify-otp/", {
      method: "POST",
      body: JSON.stringify(clean),
      skipAuth: true,
    });
  },

  // Reset password
  resetPassword: async (
    payload: ResetPasswordPayload
  ): Promise<{ message: string }> => {
    const clean = {
      ...payload,
      email: payload.email ? payload.email.trim().toLowerCase() : "",
    };
    return apiClient("/api/auth/reset-password/", {
      method: "POST",
      body: JSON.stringify(clean),
      skipAuth: true,
    });
  },

  // Logout
  logout: () => {
    invalidateClientCache();
    clearAuthSession();
  },
};

// Import models
import {
  PaginatedResponse,
  Briefing,
  Creator,
  NotificationItem,
  LibraryItem,
  SubscriptionPlan,
  FeedbackPayload,
  ContactMessagePayload,
} from "./types/api";

// Briefings API
export const briefingsApi = {
  list: async (params?: {
    timeframe?: string;
    search?: string;
    category?: string;
    creator_id?: string;
    page?: number;
  }): Promise<PaginatedResponse<Briefing>> => {
    const query = new URLSearchParams();
    if (params?.timeframe && params.timeframe !== "both") {
      query.set("timeframe", params.timeframe);
    }
    if (params?.search) {
      query.set("search", params.search);
    }
    if (params?.category) {
      query.set("category", params.category);
    }
    if (params?.creator_id) {
      query.set("creator_id", params.creator_id);
    }
    if (params?.page) {
      query.set("page", params.page.toString());
    }
    const qs = query.toString();
    return apiClient<PaginatedResponse<Briefing>>(
      `/api/briefings/${qs ? `?${qs}` : ""}`,
      { method: "GET", cacheTtl: 1800 }
    );
  },

  getById: async (id: string): Promise<Briefing> => {
    return apiClient<Briefing>(`/api/briefings/${id}/`, { method: "GET" });
  },

  listen: async (id: string): Promise<{ message: string; listens_count: number }> => {
    return apiClient(`/api/briefings/${id}/listen/`, { method: "POST" });
  },

  triggerSync: async (): Promise<{ message: string }> => {
    const res = await apiClient<{ message: string }>("/api/briefings/sync/", { method: "POST" });
    invalidateClientCache("/api/briefings");
    return res;
  },
};

// Creators API
export const creatorsApi = {
  list: async (): Promise<PaginatedResponse<Creator> | Creator[]> => {
    return apiClient("/api/creators/", { method: "GET", cacheTtl: 1800 });
  },

  getFollowing: async (): Promise<Creator[]> => {
    const res = await apiClient<any>("/api/creators/following/", { method: "GET", cacheTtl: 1800 });
    return Array.isArray(res) ? res : res.results || [];
  },

  toggleFollow: async (
    creatorId: string
  ): Promise<{ message: string; is_following: boolean; creator: Creator }> => {
    const res = await apiClient<{ message: string; is_following: boolean; creator: Creator }>(
      `/api/creators/${creatorId}/toggle-follow/`,
      { method: "POST" }
    );
    invalidateClientCache("/api/creators/following");
    invalidateClientCache("/api/creators");
    return res;
  },

  addByUrl: async (channelUrl: string): Promise<{ message: string; creator: Creator }> => {
    const res = await apiClient<{ message: string; creator: Creator }>("/api/creators/add/", {
      method: "POST",
      body: JSON.stringify({ url: channelUrl }),
    });
    invalidateClientCache("/api/creators");
    return res;
  },

  getDetail: async (pkOrHandle: string): Promise<Creator> => {
    return apiClient<Creator>(`/api/creators/${pkOrHandle}/`, { method: "GET" });
  },
};

// Library API
export const libraryApi = {
  list: async (params?: {
    sort?: string;
    search?: string;
  }): Promise<PaginatedResponse<any> | any[]> => {
    const sp = new URLSearchParams();
    if (params?.sort) sp.set("sort", params.sort);
    if (params?.search) sp.set("search", params.search);
    const query = sp.toString() ? `?${sp.toString()}` : "";
    return apiClient(`/api/library/${query}`, { method: "GET", cacheTtl: 1800 });
  },

  toggleSave: async (
    briefingId: string
  ): Promise<{ message: string; is_saved: boolean; briefing_id: string }> => {
    const res = await apiClient<{ message: string; is_saved: boolean; briefing_id: string }>(
      `/api/library/toggle/${briefingId}/`,
      { method: "POST" }
    );
    invalidateClientCache("/api/library");
    return res;
  },

  remove: async (libraryItemId: string): Promise<{ message: string }> => {
    const res = await apiClient<{ message: string }>(`/api/library/${libraryItemId}/`, {
      method: "DELETE",
    });
    invalidateClientCache("/api/library");
    return res;
  },
};

// Notifications API
export const notificationsApi = {
  list: async (): Promise<PaginatedResponse<NotificationItem>> => {
    return apiClient<PaginatedResponse<NotificationItem>>("/api/auth/notifications/", {
      method: "GET",
      cacheTtl: 300,
    });
  },

  markRead: async (notificationId: string): Promise<{ message: string }> => {
    const res = await apiClient(`/api/auth/notifications/${notificationId}/read/`, {
      method: "POST",
    });
    invalidateClientCache("/api/auth/notifications");
    return res;
  },

  markAllRead: async (): Promise<{ message: string; count: number }> => {
    const res = await apiClient("/api/auth/notifications/mark-all-read/", {
      method: "POST",
    });
    invalidateClientCache("/api/auth/notifications");
    return res;
  },
};

// Feedback API
export const feedbackApi = {
  submit: async (data: FeedbackPayload): Promise<{ message: string; feedback: any }> => {
    const res = await apiClient<{ message: string; feedback: any }>("/api/feedback/submit/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    invalidateClientCache("/api/feedback/my-feedback");
    invalidateClientCache("/api/feedback/featured");
    invalidateClientCache("/api/feedback/admin/reviews");
    return res;
  },

  getMyFeedback: async (): Promise<any[]> => {
    const res = await apiClient<any>("/api/feedback/my-feedback/", { method: "GET", cacheTtl: 1800 });
    return Array.isArray(res) ? res : res.results || [];
  },

  getFeatured: async (): Promise<any[]> => {
    const res = await apiClient<any>("/api/feedback/featured/", {
      method: "GET",
      skipAuth: true,
      cacheTtl: 3600,
    });
    return Array.isArray(res) ? res : res.results || [];
  },
};

// Subscriptions API
export const subscriptionsApi = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const res = await apiClient<any>("/api/subscriptions/plans/", {
      method: "GET",
      cacheTtl: 3600,
    });
    return Array.isArray(res) ? res : res.results || [];
  },

  getPlanDetail: async (slugOrId: string): Promise<SubscriptionPlan> => {
    return apiClient(`/api/subscriptions/plans/${slugOrId}/`, { method: "GET" });
  },

  checkout: async (
    planId: string,
    billingCycle: string = "monthly",
    extraData?: Record<string, any>
  ): Promise<{ message: string; checkout_url?: string; subscription?: any }> => {
    return apiClient("/api/subscriptions/checkout/", {
      method: "POST",
      body: JSON.stringify({
        plan_id: planId,
        billing_cycle: billingCycle,
        ...(extraData || {}),
      }),
    });
  },

  getMyStatus: async (): Promise<any> => {
    return apiClient("/api/subscriptions/my-status/", { method: "GET", cacheTtl: 300 });
  },

  getTransactions: async (): Promise<any[]> => {
    const res = await apiClient<any>("/api/subscriptions/transactions/", {
      method: "GET",
    });
    return Array.isArray(res) ? res : res.results || [];
  },
};



// Settings & Contact API
export const settingsApi = {
  getSettings: async (): Promise<any> => {
    return apiClient("/api/settings/", { method: "GET", cacheTtl: 3600 });
  },

  sendContactMessage: async (
    data: ContactMessagePayload
  ): Promise<{ message: string }> => {
    return apiClient("/api/settings/contact/", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },
};

// Admin Users API
export const adminApi = {
  getUsers: async (params?: {
    search?: string;
    role?: string;
    page?: number;
    page_size?: number;
    suspended?: string;
    plan?: string;
  }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.role) query.set("role", params.role);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.page_size) query.set("page_size", params.page_size.toString());
    if (params?.suspended) query.set("suspended", params.suspended);
    if (params?.plan) query.set("plan", params.plan);
    const qs = query.toString();
    return apiClient(`/api/auth/admin/users/${qs ? `?${qs}` : ""}`, {
      method: "GET",
      cacheTtl: 1800,
    });
  },

  getUserDetail: async (userId: string): Promise<any> => {
    return apiClient(`/api/auth/admin/users/${userId}/`, { method: "GET", cacheTtl: 1800 });
  },

  suspendUser: async (
    userId: string,
    reason?: string
  ): Promise<{ message: string; is_suspended: boolean }> => {
    const res = await apiClient<{ message: string; is_suspended: boolean }>(
      `/api/auth/admin/users/${userId}/suspend/`,
      {
        method: "POST",
        body: JSON.stringify({ reason: reason || "" }),
      }
    );
    invalidateClientCache("/api/auth/admin/users/");
    return res;
  },

  getAnalyticsDashboard: async (): Promise<any> => {
    return apiClient("/api/analytics/dashboard/", { method: "GET", cacheTtl: 1800 });
  },

  getAuditLogs: async (params?: {
    page?: number;
    name?: string;
    search?: string;
    user_id?: string;
    plan?: string;
  } | number): Promise<any> => {
    let qs = "";
    if (typeof params === "number") {
      qs = `?page=${params}`;
    } else if (params && typeof params === "object") {
      const sp = new URLSearchParams();
      if (params.page) sp.set("page", params.page.toString());
      if (params.name) sp.set("name", params.name);
      if (params.search) sp.set("search", params.search);
      if (params.user_id) sp.set("user_id", params.user_id);
      if (params.plan) sp.set("plan", params.plan);
      qs = sp.toString() ? `?${sp.toString()}` : "";
    }
    return apiClient(`/api/analytics/audit-logs/${qs}`, {
      method: "GET",
      cacheTtl: 300,
    });
  },

  getReviews: async (): Promise<any> => {
    return apiClient("/api/feedback/admin/reviews/", { method: "GET", cacheTtl: 1800 });
  },

  toggleFeatureReview: async (reviewId: string): Promise<any> => {
    const res = await apiClient(`/api/feedback/admin/reviews/${reviewId}/toggle-feature/`, {
      method: "POST",
    });
    invalidateClientCache("/api/feedback/");
    return res;
  },

  deleteReview: async (reviewId: string): Promise<any> => {
    const res = await apiClient(`/api/feedback/admin/reviews/${reviewId}/`, {
      method: "DELETE",
    });
    invalidateClientCache("/api/feedback/");
    return res;
  },

  getContactMessages: async (): Promise<any> => {
    return apiClient("/api/settings/admin/contact-messages/", { method: "GET" });
  },

  updatePlatformSettings: async (data: Record<string, any>): Promise<any> => {
    const res = await apiClient("/api/settings/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    invalidateClientCache("/api/settings/");
    return res;
  },

  updateSubscriptionPlan: async (planId: string, data: Record<string, any>): Promise<any> => {
    const res = await apiClient(`/api/subscriptions/plans/${planId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    invalidateClientCache("/api/subscriptions/");
    return res;
  },

  getUserLocations: async (plan?: string): Promise<UserLocationsResponse> => {
    const query = plan && plan !== "ALL" ? `?plan=${encodeURIComponent(plan)}` : "";
    return apiClient<UserLocationsResponse>(`/api/analytics/user-locations/${query}`, {
      method: "GET",
      cacheTtl: 1800,
    });
  },
};

export interface UserLocationItem {
  id: string;
  user_name: string;
  email: string;
  plan: "Free" | "Pro" | "Enterprise";
  role: string;
  avatar_url?: string;
  ip_address: string;
  city: string;
  region: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  is_active_session: boolean;
  last_login: string;
  date_time: string;
}

export interface UserLocationsResponse {
  locations: UserLocationItem[];
  summary: {
    total_users_mapped: number;
    active_countries: number;
    active_cities: number;
    countries_list: string[];
  };
}

