/**
 * Sql.js adapter for Node.js/test environment
 * Uses sql.js to read SQLite databases in Node.js
 */

import initSqlJs, { Database } from "sql.js";
import { SQLiteAdapter, SQLiteRow } from "./sqliteAdapter";

export class SqlJsAdapter implements SQLiteAdapter {
  private db: Database | null = null;

  async open(file: File): Promise<void> {
    const SQL = await initSqlJs();
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    this.db = new SQL.Database(uint8Array);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async query(sql: string): Promise<SQLiteRow[]> {
    if (!this.db) {
      throw new Error("Database not open");
    }

    const results: SQLiteRow[] = [];
    const stmt = this.db.prepare(sql);

    while (stmt.step()) {
      const row: SQLiteRow = {};
      const columns = stmt.getColumnNames();
      const values = stmt.get();

      columns.forEach((col, index) => {
        row[col] = values[index];
      });

      results.push(row);
    }

    stmt.free();
    return results;
  }
}
