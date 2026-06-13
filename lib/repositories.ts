// Typed data-access helpers that map the app's in-memory shapes to/from the
// Supabase tables. Every function is a no-op-safe wrapper: if Supabase isn't
// configured the caller simply keeps using local state.

import { supabase } from './supabase';
import type { FaithTradition, MessageSender, PlanId, PrayerStatus } from '../types/database';
import type { Prayer } from '../context/PrayerContext';
import type { SavedVerse } from '../context/UserContext';
import type { StoredMessage } from '../db';

const asFaith = (f: string | null | undefined): FaithTradition =>
  (['christianity', 'islam', 'judaism', 'hinduism', 'buddhism', 'general'].includes(f ?? '')
    ? f
    : 'general') as FaithTradition;

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : '');
const dateOnly = (t: string | null) => (t ? t.slice(0, 10) : '');

// ----------------------------- Prayers -----------------------------
export async function fetchPrayers(): Promise<Prayer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('prayer_requests')
    .select('*')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    topic: r.topic,
    faith: r.faith,
    reminderTime: hhmm(r.reminder_time),
    date: dateOnly(r.reminder_date),
    status: r.status,
    recurring: r.recurring,
    createdAt: dateOnly(r.created_at),
  }));
}

export async function insertPrayer(
  userId: string,
  prayer: Omit<Prayer, 'id'>
): Promise<Prayer | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('prayer_requests')
    .insert({
      user_id: userId,
      topic: prayer.topic,
      faith: asFaith(prayer.faith),
      status: prayer.status,
      reminder_time: prayer.reminderTime || null,
      reminder_date: prayer.date || null,
      recurring: prayer.recurring ?? false,
    })
    .select('*')
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    topic: data.topic,
    faith: data.faith,
    reminderTime: hhmm(data.reminder_time),
    date: dateOnly(data.reminder_date),
    status: data.status,
    recurring: data.recurring,
    createdAt: dateOnly(data.created_at),
  };
}

export async function updatePrayerStatusRemote(id: string, status: PrayerStatus): Promise<void> {
  if (!supabase) return;
  await supabase.from('prayer_requests').update({ status }).eq('id', id);
}

export async function deletePrayerRemote(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('prayer_requests').delete().eq('id', id);
}

// --------------------------- AI messages ---------------------------
export async function fetchAiMessages(userId: string): Promise<StoredMessage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    text: r.content,
    sender: r.sender,
    faith: r.faith ?? undefined,
    timestamp: new Date(r.created_at),
  }));
}

export async function insertAiMessage(userId: string, message: StoredMessage): Promise<void> {
  if (!supabase) return;
  await supabase.from('ai_messages').insert({
    user_id: userId,
    sender: message.sender as MessageSender,
    content: message.text,
    faith: asFaith(message.faith),
    created_at: message.timestamp.toISOString(),
  });
}

export async function clearAiMessages(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('ai_messages').delete().eq('user_id', userId);
}

// --------------------------- Saved verses ---------------------------
export async function fetchSavedVerses(): Promise<SavedVerse[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('saved_verses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({ ref: r.reference, text: r.text, faith: r.faith ?? 'general' }));
}

export async function upsertSavedVerse(userId: string, verse: SavedVerse): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('saved_verses')
    .upsert(
      { user_id: userId, reference: verse.ref, text: verse.text, faith: asFaith(verse.faith) },
      { onConflict: 'user_id,reference' }
    );
}

export async function deleteSavedVerse(userId: string, ref: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('saved_verses').delete().eq('user_id', userId).eq('reference', ref);
}

// ----------------------------- Profile -----------------------------
export interface RemoteProfile {
  name: string;
  faith: FaithTradition;
}

export async function fetchProfile(userId: string): Promise<RemoteProfile | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .select('display_name, faith')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return null;
  return { name: data.display_name ?? '', faith: asFaith(data.faith) };
}

export async function updateProfile(userId: string, patch: Partial<RemoteProfile>): Promise<void> {
  if (!supabase) return;
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.display_name = patch.name;
  if (patch.faith !== undefined) row.faith = patch.faith;
  if (Object.keys(row).length) await supabase.from('profiles').update(row).eq('id', userId);
}

// ----------------------------- Settings -----------------------------
export interface RemoteSettings {
  notifications_enabled: boolean;
  reminder_sound: boolean;
  daily_verse_enabled: boolean;
}

export async function fetchSettings(userId: string): Promise<RemoteSettings | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('user_settings')
    .select('notifications_enabled, reminder_sound, daily_verse_enabled')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;
  return {
    notifications_enabled: data.notifications_enabled,
    reminder_sound: data.reminder_sound,
    daily_verse_enabled: data.daily_verse_enabled,
  };
}

export async function updateSettings(userId: string, patch: Partial<RemoteSettings>): Promise<void> {
  if (!supabase) return;
  await supabase.from('user_settings').upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' });
}

// --------------------------- Subscription ---------------------------
export async function fetchPlan(userId: string): Promise<PlanId | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle();
  return data ? data.plan : null;
}

export async function updatePlan(userId: string, plan: PlanId): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('subscriptions')
    .upsert({ user_id: userId, plan, status: 'active' }, { onConflict: 'user_id' });
}

// ----------------------------- AI usage -----------------------------
export async function fetchAiMessagesToday(userId: string): Promise<number> {
  if (!supabase) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('ai_usage')
    .select('message_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle();
  return data ? data.message_count : 0;
}

/** Atomically bumps today's counter via the SQL RPC; returns the new total. */
export async function incrementAiUsage(tokens = 0): Promise<number | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('increment_ai_usage', { p_tokens: tokens });
  if (error) return null;
  return data as number;
}

// ----------------------------- Sermons -----------------------------
export interface SermonRecord {
  id: string;
  title: string;
  audio_url: string;
  transcript: string;
  notes: string;
  summary: string;
  created_at: string;
}

export async function fetchSermons(): Promise<SermonRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('sermons')
    .select('id, title, audio_url, transcript, notes, summary, created_at')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    title: r.title ?? '',
    audio_url: r.audio_url ?? '',
    transcript: r.transcript ?? '',
    notes: r.notes ?? '',
    summary: r.summary ?? '',
    created_at: r.created_at,
  }));
}

export async function insertSermon(
  userId: string,
  sermon: { title: string; notes: string; summary: string; transcript?: string; audio_url?: string }
): Promise<SermonRecord | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('sermons')
    .insert({
      user_id: userId,
      title: sermon.title,
      audio_url: sermon.audio_url || null,
      transcript: sermon.transcript || null,
      notes: sermon.notes,
      summary: sermon.summary,
      status: 'completed',
    })
    .select('id, title, audio_url, transcript, notes, summary, created_at')
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    title: data.title ?? '',
    audio_url: data.audio_url ?? '',
    transcript: data.transcript ?? '',
    notes: data.notes ?? '',
    summary: data.summary ?? '',
    created_at: data.created_at,
  };
}

export async function deleteSermon(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('sermons').delete().eq('id', id);
}

// ----------------------------- Payments -----------------------------
export interface PaymentRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  paid_at: string | null;
  created_at: string;
}

export async function fetchPayments(): Promise<PaymentRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('payments')
    .select('id, amount, currency, status, reference, paid_at, created_at')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as PaymentRow[];
}
