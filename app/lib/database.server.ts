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
  itemCount: number;
  createdAt: string;
};

export type CollectionItem = {
  id: number;
  path: string;
  movieName: string | null;
  movieReleaseYear: number | null;
  movieLength: number | null;
  movieProgress: number;
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
      CREATE TABLE IF NOT EXISTS scan_folders (
        id INTEGER PRIMARY KEY,
        path TEXT NOT NULL UNIQUE,
        collection_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY,
        collection_id INTEGER NOT NULL,
        path TEXT NOT NULL,
        movie_name TEXT,
        movie_release_year INTEGER,
        movie_length INTEGER,
        movie_progress INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_id) REFERENCES scan_folders(id),
        UNIQUE (collection_id, path)
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

    const collectionColumns = database.prepare("PRAGMA table_info(collections)").all() as {
      name: string;
    }[];
    const missingCollectionColumns = [
      ["movie_name", "TEXT"],
      ["movie_release_year", "INTEGER"],
      ["movie_length", "INTEGER"],
      ["movie_progress", "INTEGER NOT NULL DEFAULT 0"],
    ] as const;

    for (const [name, definition] of missingCollectionColumns) {
      if (!collectionColumns.some((column) => column.name === name)) {
        database.exec(`ALTER TABLE collections ADD COLUMN ${name} ${definition}`);
      }
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
        `SELECT
          scan_folders.id,
          scan_folders.path,
          scan_folders.collection_name AS collectionName,
          COUNT(collections.id) AS itemCount,
          scan_folders.created_at AS createdAt
        FROM scan_folders
        LEFT JOIN collections ON collections.collection_id = scan_folders.id
        GROUP BY scan_folders.id
        ORDER BY scan_folders.created_at DESC`,
      )
      .all() as ScanFolder[];
  } finally {
    database.close();
  }
}

export function getItemCount() {
  initializeDatabase();

  const database = new DatabaseSync(databasePath);
  try {
    const row = database.prepare("SELECT COUNT(*) AS count FROM collections").get() as {
      count: number;
    };
    return row.count;
  } finally {
    database.close();
  }
}

export function getCollection(id: number) {
  initializeDatabase();

  const database = new DatabaseSync(databasePath);
  try {
    return (database
      .prepare(
        "SELECT id, path, collection_name AS collectionName FROM scan_folders WHERE id = ?",
      )
      .get(id) as Pick<ScanFolder, "id" | "path" | "collectionName"> | undefined) ?? null;
  } finally {
    database.close();
  }
}

export function getCollectionItems(collectionId: number): CollectionItem[] {
  initializeDatabase();

  const database = new DatabaseSync(databasePath);
  try {
    return database
      .prepare(
        `SELECT
          id,
          path,
          movie_name AS movieName,
          movie_release_year AS movieReleaseYear,
          movie_length AS movieLength,
          movie_progress AS movieProgress,
          created_at AS createdAt
        FROM collections
        WHERE collection_id = ?
        ORDER BY movie_name, path`,
      )
      .all(collectionId) as CollectionItem[];
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

export function deleteScanFolder(id: number) {
  initializeDatabase();

  const database = new DatabaseSync(databasePath);
  try {
    database.prepare("DELETE FROM scan_folders WHERE id = ?").run(id);
  } finally {
    database.close();
  }
}
