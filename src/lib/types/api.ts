export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Briefing {
  id: string;
  title: string;
  youtube_url?: string;
  duration: string;
  thumbnail_url: string;
  channel_name: string;
  channel_handle: string;
  channel_avatar_color: string;
  channel_initials: string;
  subscribers: string;
  summary: string;
  full_summary?: string;
  key_takeaways?: string[];
  audio_url?: string;
  timeframe: "daily" | "weekly" | string;
  category: string;
  is_saved: boolean;
  listens_count: number;
  saves_count: number;
  created_at: string;
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  channel_url?: string;
  avatar_url?: string;
  initials: string;
  avatar_gradient: string;
  description: string;
  video_count: number;
  subscriber_count: string;
  is_following: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  avatar_url?: string;
  is_read: boolean;
  created_at: string;
  time_ago: string;
}

export interface LibraryItem {
  id: string;
  briefing: Briefing;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: string;
  currency: string;
  period: string;
  billing_cycle: string;
  badge_text: string;
  is_popular: boolean;
  is_best_offer: boolean;
  is_active: boolean;
  features: string[];
  free_trial_days: number;
}

export interface FeedbackPayload {
  briefing_id?: string;
  rating?: number;
  useful_feedback?: string;
  thoughts?: string;
  request_improved?: boolean;
  request_option?: string;
  is_platform_review?: boolean;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
}
