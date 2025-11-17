import * as SQLite from 'expo-sqlite';

export async function openDatabase() {
    const db = await SQLite.openDatabaseAsync("support.db");
    return db;
}

export async function initializeDb(db: SQLite.SQLiteDatabase){
    await db.execAsync("DROP TABLE IF EXISTS prayers;");
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS prayers(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        faith TEXT,
        title TEXT,
        content TEXT,
        createdAt TEXT
    );
    `);
    //console.log("Database initialized");

    await db.execAsync("DROP TABLE IF EXISTS messages;");
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL
    );
  `);
  return db;
}

export async function saveMessage(db: SQLite.SQLiteDatabase, message: { id: string; text: string; sender: string; timestamp: Date }) {
  await db.execAsync(
    `INSERT OR REPLACE INTO messages (id, text, sender, timestamp) VALUES (?, ?, ?, ?)`,
    [message.id, message.text, message.sender, message.timestamp.toISOString()]
  );
}

export async function loadMessages(db: SQLite.SQLiteDatabase) {
  const result = await db.execAsync(`SELECT * FROM messages ORDER BY timestamp ASC`);

   // Check result
  if (!result || !result[0] || !result[0].rows) {
    return []; // return empty array if no results
  }
  
  return result.rows._array.map((row: any) => ({
    id: row.id,
    text: row.text,
    sender: row.sender as 'user' | 'ai',
    timestamp: new Date(row.timestamp),
  }));
}