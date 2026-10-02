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
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8055";

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
}

// Core fetch wrapper
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, headers = {}, ...restOptions } = options;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const requestHeaders = new Headers(headers);

  // If not FormData, default to application/json
  if (!(restOptions.body instanceof FormData) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  // Attach token if needed
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  let response = await fetch(url, {
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

  return data as T;
}

// Auth API endpoints
export const authApi = {
  // Login
  login: async (credentials: LoginPayload): Promise<LoginResponse> => {
    const res = await apiClient<LoginResponse>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
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
    const res = await apiClient<{ message: string; user: User }>("/api/auth/register/", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    if (res && res.user) {
      res.user = normalizeUser(res.user) || res.user;
    }
    return res;
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const user = await apiClient<User>("/api/auth/profile/", {
      method: "GET",
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
    const normalized = normalizeUser(updated) || updated;
    setStoredUser(normalized);
    return normalized;
  },

  // Change password
  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    return apiClient("/api/auth/change-password/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Forgot password (request OTP)
  forgotPassword: async (
    payload: ForgotPasswordPayload
  ): Promise<{ message: string; email: string; otp?: string; expires_in_minutes: number }> => {
    return apiClient("/api/auth/forgot-password/", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  // Verify OTP
  verifyOtp: async (
    payload: VerifyOtpPayload
  ): Promise<{ message: string; valid?: boolean }> => {
    return apiClient("/api/auth/verify-otp/", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  // Reset password
  resetPassword: async (
    payload: ResetPasswordPayload
  ): Promise<{ message: string }> => {
    return apiClient("/api/auth/reset-password/", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  // Logout
  logout: () => {
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
      { method: "GET" }
    );
  },

  getById: async (id: string): Promise<Briefing> => {
    return apiClient<Briefing>(`/api/briefings/${id}/`, { method: "GET" });
  },

  listen: async (id: string): Promise<{ message: string; listens_count: number }> => {
    return apiClient(`/api/briefings/${id}/listen/`, { method: "POST" });
  },
};

// Creators API
export const creatorsApi = {
  list: async (): Promise<PaginatedResponse<Creator> | Creator[]> => {
    return apiClient("/api/creators/", { method: "GET" });
  },

  getFollowing: async (): Promise<Creator[]> => {
    const res = await apiClient<any>("/api/creators/following/", { method: "GET" });
    return Array.isArray(res) ? res : res.results || [];
  },

  toggleFollow: async (
    creatorId: string
  ): Promise<{ message: string; is_following: boolean; creator: Creator }> => {
    return apiClient(`/api/creators/${creatorId}/toggle-follow/`, { method: "POST" });
  },

  addByUrl: async (channelUrl: string): Promise<{ message: string; creator: Creator }> => {
    return apiClient("/api/creators/add/", {
      method: "POST",
      body: JSON.stringify({ url: channelUrl }),
    });
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
    return apiClient(`/api/library/${query}`, { method: "GET" });
  },

  toggleSave: async (
    briefingId: string
  ): Promise<{ message: string; is_saved: boolean; briefing_id: string }> => {
    return apiClient(`/api/library/toggle/${briefingId}/`, { method: "POST" });
  },

  remove: async (libraryItemId: string): Promise<{ message: string }> => {
    return apiClient(`/api/library/${libraryItemId}/`, { method: "DELETE" });
  },
};

// Notifications API
export const notificationsApi = {
  list: async (): Promise<PaginatedResponse<NotificationItem>> => {
    return apiClient<PaginatedResponse<NotificationItem>>("/api/auth/notifications/", {
      method: "GET",
    });
  },

  markRead: async (notificationId: string): Promise<{ message: string }> => {
    return apiClient(`/api/auth/notifications/${notificationId}/read/`, {
      method: "POST",
    });
  },

  markAllRead: async (): Promise<{ message: string; count: number }> => {
    return apiClient("/api/auth/notifications/mark-all-read/", {
      method: "POST",
    });
  },
};

// Feedback API
export const feedbackApi = {
  submit: async (data: FeedbackPayload): Promise<{ message: string; feedback: any }> => {
    return apiClient("/api/feedback/submit/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMyFeedback: async (): Promise<any[]> => {
    const res = await apiClient<any>("/api/feedback/my-feedback/", { method: "GET" });
    return Array.isArray(res) ? res : res.results || [];
  },
};

// Subscriptions API
export const subscriptionsApi = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const res = await apiClient<any>("/api/subscriptions/plans/", { method: "GET" });
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
    return apiClient("/api/subscriptions/my-status/", { method: "GET" });
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
    return apiClient("/api/settings/", { method: "GET" });
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
  getUsers: async (params?: { search?: string; role?: string; page?: number }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.role) query.set("role", params.role);
    if (params?.page) query.set("page", params.page.toString());
    const qs = query.toString();
    return apiClient(`/api/auth/admin/users/${qs ? `?${qs}` : ""}`, { method: "GET" });
  },

  getUserDetail: async (userId: string): Promise<any> => {
    return apiClient(`/api/auth/admin/users/${userId}/`, { method: "GET" });
  },

  suspendUser: async (
    userId: string,
    reason?: string
  ): Promise<{ message: string; is_suspended: boolean }> => {
    return apiClient(`/api/auth/admin/users/${userId}/suspend/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  },

  getAnalyticsDashboard: async (): Promise<any> => {
    return apiClient("/api/analytics/dashboard/", { method: "GET" });
  },

  getAuditLogs: async (page?: number): Promise<any> => {
    return apiClient(`/api/analytics/audit-logs/${page ? `?page=${page}` : ""}`, {
      method: "GET",
    });
  },

  getReviews: async (): Promise<any> => {
    return apiClient("/api/feedback/admin/reviews/", { method: "GET" });
  },

  toggleFeatureReview: async (reviewId: string): Promise<any> => {
    return apiClient(`/api/feedback/admin/reviews/${reviewId}/toggle-feature/`, {
      method: "POST",
    });
  },

  deleteReview: async (reviewId: string): Promise<any> => {
    return apiClient(`/api/feedback/admin/reviews/${reviewId}/`, {
      method: "DELETE",
    });
  },

  getContactMessages: async (): Promise<any> => {
    return apiClient("/api/settings/admin/contact-messages/", { method: "GET" });
  },

  updatePlatformSettings: async (data: Record<string, any>): Promise<any> => {
    return apiClient("/api/settings/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  updateSubscriptionPlan: async (planId: string, data: Record<string, any>): Promise<any> => {
    return apiClient(`/api/subscriptions/plans/${planId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

