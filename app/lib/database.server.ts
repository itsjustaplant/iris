import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import envPaths from "env-paths";

const appDataDirectory = envPaths("Iris", { suffix: "" }).data;
console.log(appDataDirectory)
export const databasePath = join(appDataDirectory, "iris.sqlite");

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
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    database.close();
  }
}
