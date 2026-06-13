import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** True only when both env vars are present. */
export const isSupabaseConfigured = Boolean(url && anonKey);

// A minimal storage adapter. Uses localStorage on web; falls back to an
// in-memory store elsewhere so the bundle never crashes when AsyncStorage
// isn't installed. For persistent native sessions, install
// `@react-native-async-storage/async-storage` and swap it in here.
const memory = new Map<string, string>();
const storage = {
  getItem: (key: string) => {
    if (typeof globalThis.localStorage !== 'undefined') return globalThis.localStorage.getItem(key);
    return memory.get(key) ?? null;
  },
  setItem: (key: string, value: string) => {
    if (typeof globalThis.localStorage !== 'undefined') globalThis.localStorage.setItem(key, value);
    else memory.set(key, value);
  },
  removeItem: (key: string) => {
    if (typeof globalThis.localStorage !== 'undefined') globalThis.localStorage.removeItem(key);
    else memory.delete(key);
  },
};

// `supabase` is null until the env vars are set, so importing this module is
// always safe. Guard usages with `isSupabaseConfigured` or optional chaining.
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url as string, anonKey as string, {
      auth: {
        storage: storage as any,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/** Throws a clear error if Supabase isn't configured yet. */
export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    );
  }
  return supabase;
}
