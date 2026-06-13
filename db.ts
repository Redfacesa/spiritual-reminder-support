import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

export type MessageSender = 'user' | 'ai';

export interface StoredMessage {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
  faith?: string;
}

// On web, expo-sqlite relies on an OPFS sync access handle that can only be
// held by one connection at a time. Fast Refresh and page reloads routinely
// leave a stale handle locked, which throws:
//   "Access Handles cannot be created if there is another open Access Handle".
// To avoid that entirely we persist chat history with localStorage on web and
// keep SQLite only on native platforms (where it works reliably).
const isWeb = Platform.OS === 'web';
const WEB_KEY = 'support.messages.v1';

// ---------- Web (localStorage) ----------
function webLoad(): StoredMessage[] {
  try {
    const raw = globalThis.localStorage?.getItem(WEB_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as StoredMessage[]).map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return [];
  }
}

function webSave(messages: StoredMessage[]) {
  try {
    globalThis.localStorage?.setItem(WEB_KEY, JSON.stringify(messages));
  } catch {
    // storage may be unavailable (private mode) — fail silently
  }
}

// ---------- Native (SQLite) ----------
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getNativeDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('support.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY NOT NULL,
          sender TEXT NOT NULL,
          text TEXT NOT NULL,
          faith TEXT,
          timestamp TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

// ---------- Public API (platform-agnostic) ----------
export async function loadMessages(): Promise<StoredMessage[]> {
  if (isWeb) return webLoad();

  const db = await getNativeDb();
  const rows = await db.getAllAsync<{
    id: string;
    sender: string;
    text: string;
    faith: string | null;
    timestamp: string;
  }>(`SELECT id, sender, text, faith, timestamp FROM messages ORDER BY timestamp ASC`);

  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    sender: (row.sender === 'ai' ? 'ai' : 'user') as MessageSender,
    timestamp: new Date(row.timestamp),
    faith: row.faith ?? undefined,
  }));
}

export async function saveMessage(message: StoredMessage): Promise<void> {
  if (isWeb) {
    const all = webLoad();
    const idx = all.findIndex((m) => m.id === message.id);
    if (idx >= 0) all[idx] = message;
    else all.push(message);
    webSave(all);
    return;
  }

  const db = await getNativeDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO messages (id, sender, text, faith, timestamp) VALUES (?, ?, ?, ?, ?)`,
    [message.id, message.sender, message.text, message.faith ?? null, message.timestamp.toISOString()]
  );
}

export async function clearMessages(): Promise<void> {
  if (isWeb) {
    webSave([]);
    return;
  }
  const db = await getNativeDb();
  await db.runAsync(`DELETE FROM messages`);
}
