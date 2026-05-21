/**
 * WaSQLite adapter for browser environment
 * Uses @journeyapps/wa-sqlite to read SQLite databases in the browser
 */

import * as SQLite from "@journeyapps/wa-sqlite";
import SQLiteESMFactory from "@journeyapps/wa-sqlite/dist/wa-sqlite-async.mjs";
import { SQLiteAdapter, SQLiteRow } from "./sqliteAdapter";

interface WaSQLiteDB {
  api: SQLiteAPI;
  db: number;
}

export class WaSQLiteAdapter implements SQLiteAdapter {
  private dbObj: WaSQLiteDB | null = null;

  async open(file: File): Promise<void> {
    // Initialize wa-sqlite
    const module = await SQLiteESMFactory();
    const api = SQLite.Factory(module);

    // Read the file data
    const fileBuffer = await file.arrayBuffer();

    // Create and register a custom VFS that has the file pre-loaded
    const vfs = await this.createVFSWithFile(module, "imessage.db", fileBuffer);
    api.vfs_register(vfs, true);

    // Open the database (it will now read from our pre-populated VFS)
    const db = await api.open_v2("imessage.db");

    this.dbObj = { api, db };
  }

  async close(): Promise<void> {
    if (this.dbObj) {
      await this.dbObj.api.close(this.dbObj.db);
      this.dbObj = null;
    }
  }

  async query(sql: string): Promise<SQLiteRow[]> {
    if (!this.dbObj) {
      throw new Error("Database not open");
    }

    const { api, db } = this.dbObj;
    const results: SQLiteRow[] = [];

    // Use the statements iterator API
    for await (const stmt of api.statements(db, sql)) {
      const cols = api.column_names(stmt);

      while ((await api.step(stmt)) === SQLite.SQLITE_ROW) {
        const row: SQLiteRow = {};
        for (let i = 0; i < cols.length; i++) {
          row[cols[i]] = api.column(stmt, i);
        }
        results.push(row);
      }
    }

    return results;
  }

  private async createVFSWithFile(module: any, filename: string, data: ArrayBuffer) {
    // Import MemoryAsyncVFS
    const { MemoryAsyncVFS } = await import("@journeyapps/wa-sqlite/src/examples/MemoryAsyncVFS.js");

    // Create the VFS using the static create method
    const vfs: any = await (MemoryAsyncVFS as any).create("imessage-vfs", module);

    // Pre-populate the file in the VFS
    // We do this by accessing the internal map directly
    const url = new URL(filename, "file://");
    const pathname = url.pathname;

    vfs.mapNameToFile.set(pathname, {
      pathname,
      flags: 0,
      size: data.byteLength,
      data: data
    });

    return vfs;
  }
}
