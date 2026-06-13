import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/database';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** True only when both env vars are present. */
export const isSupabaseConfigured = Boolean(url && anonKey);

// Storage adapter for the auth session.
//  - Web: browser localStorage.
//  - Native: AsyncStorage so the session survives app restarts (persistent login).
const storage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) =>
          typeof globalThis.localStorage !== 'undefined'
            ? globalThis.localStorage.getItem(key)
            : null,
        setItem: (key: string, value: string) => {
          if (typeof globalThis.localStorage !== 'undefined') globalThis.localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          if (typeof globalThis.localStorage !== 'undefined') globalThis.localStorage.removeItem(key);
        },
      }
    : AsyncStorage;

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
