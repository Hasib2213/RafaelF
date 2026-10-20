export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  address?: string;
  company?: string;
  position?: string;
  avatar?: string | null;
  avatar_url?: string;
  role: "admin" | "user" | string;
  plan: "Free" | "Pro" | "Enterprise" | string;
  is_suspended: boolean;
  suspension_reason?: string;
  is_staff: boolean;
  is_superuser?: boolean;
  date_joined: string;
  following_count: number;
  saved_briefings_count: number;
  feedback_count: number;
  recent_transactions?: any[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  confirm_password: string;
  first_name?: string;
  last_name?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  password: string;
  confirm_password: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  confirm_password: string;
}
