/**
 * Database adapter interface for SQLite operations
 * This allows us to swap implementations between wa-sqlite (browser) and sql.js (tests)
 */

export interface SQLiteAdapter {
  open(file: File): Promise<void>;
  close(): Promise<void>;
  query(sql: string): Promise<any[]>;
}

export interface SQLiteRow {
  [key: string]: any;
}
