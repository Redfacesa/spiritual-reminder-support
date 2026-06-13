// TypeScript types mirroring supabase/migrations/0001_initial_schema.sql.
// Pass `Database` to createClient<Database>() for end-to-end type safety.

export type FaithTradition =
  | 'christianity'
  | 'islam'
  | 'judaism'
  | 'hinduism'
  | 'buddhism'
  | 'general';

export type PrayerStatus = 'active' | 'completed' | 'answered' | 'archived';
export type PlanId = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
export type MessageSender = 'user' | 'ai';
export type NotificationStatus = 'scheduled' | 'sent' | 'canceled';
export type SermonStatus = 'recording' | 'uploaded' | 'transcribing' | 'completed' | 'failed';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned' | 'reversed';

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  faith: FaithTradition;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type UserSettings = {
  user_id: string;
  notifications_enabled: boolean;
  reminder_sound: boolean;
  daily_verse_enabled: boolean;
  theme: string;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

export type PrayerRequest = {
  id: string;
  user_id: string;
  topic: string;
  faith: FaithTradition;
  status: PrayerStatus;
  reminder_time: string | null;
  reminder_date: string | null;
  recurring: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type PrayerLog = {
  id: string;
  user_id: string;
  prayer_id: string;
  action: string;
  note: string | null;
  logged_at: string;
}

export type SavedVerse = {
  id: string;
  user_id: string;
  reference: string;
  text: string;
  faith: FaithTradition | null;
  source: string | null;
  created_at: string;
}

export type AiUsage = {
  id: string;
  user_id: string;
  usage_date: string;
  message_count: number;
  tokens_used: number;
  updated_at: string;
}

export type AiMessage = {
  id: string;
  user_id: string;
  sender: MessageSender;
  content: string;
  faith: FaithTradition | null;
  created_at: string;
}

export type Subscription = {
  id: string;
  user_id: string;
  plan: PlanId;
  status: SubscriptionStatus;
  provider: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export type Sermon = {
  id: string;
  user_id: string;
  title: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  summary: string | null;
  notes: string | null;
  status: SermonStatus;
  created_at: string;
  updated_at: string;
}

export type Notification = {
  id: string;
  user_id: string;
  prayer_id: string | null;
  title: string;
  body: string | null;
  scheduled_for: string | null;
  status: NotificationStatus;
  push_token: string | null;
  created_at: string;
}

export type Payment = {
  id: string;
  user_id: string | null;
  email: string | null;
  provider: string;
  reference: string;
  plan_code: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paid_at: string | null;
  raw: unknown | null;
  created_at: string;
  updated_at: string;
}

// Helper: an insert payload — generated columns/defaults become optional.
type Insertable<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>;

type DefaultCols = 'id' | 'created_at' | 'updated_at';

interface TableDef<Row, Insert, Update> {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile, Insertable<Profile, 'created_at' | 'updated_at' | 'faith' | 'display_name' | 'avatar_url' | 'email'>, Partial<Profile>>;
      user_settings: TableDef<UserSettings, Insertable<UserSettings, 'created_at' | 'updated_at' | 'notifications_enabled' | 'reminder_sound' | 'daily_verse_enabled' | 'theme' | 'timezone'>, Partial<UserSettings>>;
      prayer_requests: TableDef<PrayerRequest, Insertable<PrayerRequest, DefaultCols | 'status' | 'faith' | 'recurring' | 'reminder_time' | 'reminder_date' | 'notes'>, Partial<PrayerRequest>>;
      prayer_logs: TableDef<PrayerLog, Insertable<PrayerLog, 'id' | 'logged_at' | 'note'>, Partial<PrayerLog>>;
      saved_verses: TableDef<SavedVerse, Insertable<SavedVerse, 'id' | 'created_at' | 'faith' | 'source'>, Partial<SavedVerse>>;
      ai_usage: TableDef<AiUsage, Insertable<AiUsage, 'id' | 'updated_at' | 'usage_date' | 'message_count' | 'tokens_used'>, Partial<AiUsage>>;
      ai_messages: TableDef<AiMessage, Insertable<AiMessage, 'id' | 'created_at' | 'faith'>, Partial<AiMessage>>;
      subscriptions: TableDef<Subscription, Insertable<Subscription, DefaultCols | 'plan' | 'status' | 'provider' | 'provider_customer_id' | 'provider_subscription_id' | 'current_period_end'>, Partial<Subscription>>;
      sermons: TableDef<Sermon, Insertable<Sermon, DefaultCols | 'status' | 'title' | 'audio_url' | 'duration_seconds' | 'transcript' | 'summary' | 'notes'>, Partial<Sermon>>;
      notifications: TableDef<Notification, Insertable<Notification, 'id' | 'created_at' | 'status' | 'prayer_id' | 'body' | 'scheduled_for' | 'push_token'>, Partial<Notification>>;
      payments: TableDef<Payment, Insertable<Payment, DefaultCols | 'user_id' | 'email' | 'provider' | 'plan_code' | 'currency' | 'status' | 'paid_at' | 'raw'>, Partial<Payment>>;
    };
    Views: Record<string, never>;
    Functions: {
      increment_ai_usage: {
        Args: { p_tokens?: number };
        Returns: number;
      };
      apply_successful_payment: {
        Args: {
          p_email: string;
          p_reference: string;
          p_amount: number;
          p_currency: string;
          p_plan_code: string | null;
          p_paid_at: string | null;
          p_raw: unknown;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
