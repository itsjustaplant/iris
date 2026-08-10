import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import envPaths from "env-paths";

const appDataDirectory = envPaths("Iris", { suffix: "" }).data;
console.log(appDataDirectory)
export const databasePath = join(appDataDirectory, "iris.sqlite");

export type ScanFolder = {
  id: number;
  path: string;
  collectionName: string;
  createdAt: string;
};

/**
 * Creates the local database on the first server start and ensures its initial
 * tables exist on subsequent starts.
 */
export function initializeDatabase() {
  mkdirSync(appDataDirectory, { recursive: true });

  const database = new DatabaseSync(databasePath);
  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        folder_path TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS scan_folders (
        id INTEGER PRIMARY KEY,
        path TEXT NOT NULL UNIQUE,
        collection_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const columns = database.prepare("PRAGMA table_info(scan_folders)").all() as {
      name: string;
    }[];

    if (!columns.some((column) => column.name === "collection_name")) {
      database.exec(
        "ALTER TABLE scan_folders ADD COLUMN collection_name TEXT NOT NULL DEFAULT ''",
      );
    }
  } finally {
    database.close();
  }
}

export function getScanFolders(): ScanFolder[] {
  initializeDatabase();

  const database = new DatabaseSync(databasePath);
  try {
    return database
      .prepare(
        "SELECT id, path, collection_name AS collectionName, created_at AS createdAt FROM scan_folders ORDER BY created_at DESC",
      )
      .all() as ScanFolder[];
  } finally {
    database.close();
  }
}

export function addScanFolder(path: string, collectionName: string) {
  initializeDatabase();

  const database = new DatabaseSync(databasePath);
  try {
    database
      .prepare(
        "INSERT INTO scan_folders (path, collection_name) VALUES (?, ?) ON CONFLICT(path) DO UPDATE SET collection_name = excluded.collection_name",
      )
      .run(path, collectionName);
  } finally {
    database.close();
  }
}
