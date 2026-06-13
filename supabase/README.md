# Supabase Database

Cloud schema for the Spiritual Reminder & Support app.

## Tables

| Table             | Purpose                                                        |
| ----------------- | -------------------------------------------------------------- |
| `profiles`        | One row per user (1:1 with `auth.users`); display name + faith.|
| `user_settings`   | Per-user preferences (notifications, theme, timezone).         |
| `prayer_requests` | Prayers with status (active / completed / answered / archived).|
| `prayer_logs`     | History of actions taken on each prayer.                       |
| `saved_verses`    | Bookmarked verses/teachings.                                   |
| `ai_usage`        | Daily AI message counter (powers the free-tier limit).         |
| `ai_messages`     | AI Guide chat history (cloud-synced).                          |
| `subscriptions`   | Plan (`free`/`pro`) + provider/billing status.                 |
| `sermons`         | Pro sermon recordings, transcripts, summaries.                 |
| `notifications`   | Scheduled reminders / push log.                                |

Every table has **Row Level Security** enabled so a user can only read/write
their own rows (`auth.uid() = user_id`, or `id` for `profiles`).

On signup, a trigger (`handle_new_user`) auto-creates the user's `profiles`,
`user_settings`, and a free `subscriptions` row.

## Applying the schema

### Option A — Supabase SQL Editor (quickest)
1. Open your project at https://supabase.com/dashboard
2. **SQL Editor → New query**
3. Paste the contents of `migrations/0001_initial_schema.sql` and **Run**.

### Option B — Supabase CLI
```bash
npm i -g supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## Connecting the app

1. In the project's **Settings → API**, copy the Project URL and the `anon` public key.
2. Add them to the root `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```
3. Use the client:
   ```ts
   import { supabase, isSupabaseConfigured } from '../lib/supabase';

   if (isSupabaseConfigured) {
     const { data } = await supabase!.from('prayer_requests').select('*');
   }
   ```

## Notes

- The `anon` key is safe to ship in the client — RLS is what protects the data.
- Native session persistence needs `@react-native-async-storage/async-storage`
  (swap it into `lib/supabase.ts`); web uses `localStorage` automatically.
- Increment AI usage atomically via the RPC: `supabase.rpc('increment_ai_usage', { p_tokens: 0 })`.
