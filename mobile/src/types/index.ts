export enum ContentType {
  BOOK = 'book',
  AUDIOBOOK = 'audiobook',
  PODCAST = 'podcast',
  VIDEO = 'video',
}

export enum AccessType {
  FREE = 'free',
  PREMIUM = 'premium',
  COINS = 'coins',
  SUBSCRIPTION = 'subscription',
}

export interface User {
  id: string;
  mobile_number: string;
  country_code: string;
  name?: string;
  email?: string;
  profile_image?: string;
  coin_balance: number;
  is_premium: boolean;
  premium_expires_at?: string;
  created_at: string;
  preferences: Record<string, any>;
}

export interface AuthResponse {
  access_token: string;
  user: User;
  is_new_user: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  duration?: number;
  content?: string;
  audio_url?: string;
  youtube_id?: string;
  thumbnail?: string;
  is_free?: boolean;
  coin_cost?: number;
  description?: string;
  estimated_read_time?: number;
  narrator?: string;
}

export interface Content {
  id: string;
  title: string;
  description: string;
  content_type: ContentType;
  cover_image: string;
  author_id: string;
  author_name: string;
  narrator_id?: string;
  narrator_name?: string;
  category_ids: string[];
  language: string;
  duration?: number;
  rating: number;
  reviews_count: number;
  access_type: AccessType;
  coin_price: number;
  chapters: Chapter[];
  sample_chapter_id?: string;
  is_trending: boolean;
  is_featured: boolean;
  is_new_release: boolean;
  created_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  content_id: string;
  content_type: ContentType;
  current_chapter_id?: string;
  current_position: number;
  total_progress: number;
  last_accessed: string;
  completed: boolean;
}

export interface Banner {
  id: string;
  title: string;
  image: string;
  content_id?: string;
  action_url?: string;
  order: number;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}
