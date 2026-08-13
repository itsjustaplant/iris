import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import envPaths from "env-paths";

import type { ScannedVideo } from "~/lib/media-scanner.server";

const appDataDirectory = envPaths("Iris", { suffix: "" }).data;
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
  tmdbId: number | null;
  overview: string | null;
  releaseDate: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  tmdbRating: number | null;
  tmdbLastFetchedAt: string | null;
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
        tmdb_id INTEGER,
        overview TEXT,
        release_date TEXT,
        poster_path TEXT,
        backdrop_path TEXT,
        tmdb_rating REAL,
        tmdb_last_fetched_at TEXT,
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
      ["tmdb_id", "INTEGER"],
      ["overview", "TEXT"],
      ["release_date", "TEXT"],
      ["poster_path", "TEXT"],
      ["backdrop_path", "TEXT"],
      ["tmdb_rating", "REAL"],
      ["tmdb_last_fetched_at", "TEXT"],
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

export function getScanFolderByPath(path: string) {
  initializeDatabase();

  const database = new DatabaseSync(databasePath);
  try {
    return (database
      .prepare(
        "SELECT id, path, collection_name AS collectionName FROM scan_folders WHERE path = ?",
      )
      .get(path) as Pick<ScanFolder, "id" | "path" | "collectionName"> | undefined) ?? null;
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
          tmdb_id AS tmdbId,
          overview,
          release_date AS releaseDate,
          poster_path AS posterPath,
          backdrop_path AS backdropPath,
          tmdb_rating AS tmdbRating,
          tmdb_last_fetched_at AS tmdbLastFetchedAt,
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

export function getCollectionItem(collectionId: number, itemId: number) {
  initializeDatabase();

  const database = new DatabaseSync(databasePath);
  try {
    return (database
      .prepare(
        `SELECT
          id,
          path,
          movie_name AS movieName,
          movie_release_year AS movieReleaseYear,
          movie_length AS movieLength,
          movie_progress AS movieProgress,
          tmdb_id AS tmdbId,
          overview,
          release_date AS releaseDate,
          poster_path AS posterPath,
          backdrop_path AS backdropPath,
          tmdb_rating AS tmdbRating,
          tmdb_last_fetched_at AS tmdbLastFetchedAt,
          created_at AS createdAt
        FROM collections
        WHERE collection_id = ? AND id = ?`,
      )
      .get(collectionId, itemId) as CollectionItem | undefined) ?? null;
  } finally {
    database.close();
  }
}

export function getCollectionItemById(itemId: number) {
  initializeDatabase();

  const database = new DatabaseSync(databasePath);
  try {
    return (database
      .prepare(
        `SELECT
          id,
          path,
          movie_name AS movieName,
          movie_release_year AS movieReleaseYear,
          movie_length AS movieLength,
          movie_progress AS movieProgress,
          tmdb_id AS tmdbId,
          overview,
          release_date AS releaseDate,
          poster_path AS posterPath,
          backdrop_path AS backdropPath,
          tmdb_rating AS tmdbRating,
          tmdb_last_fetched_at AS tmdbLastFetchedAt,
          created_at AS createdAt
        FROM collections
        WHERE id = ?`,
      )
      .get(itemId) as CollectionItem | undefined) ?? null;
  } finally {
    database.close();
  }
}

export function updateMovieProgress(
  itemId: number,
  positionSeconds: number,
  durationSeconds: number,
) {
  initializeDatabase();

  const database = new DatabaseSync(databasePath);
  try {
    const result = database
      .prepare(
        `UPDATE collections
         SET movie_progress = ?, movie_length = ?
         WHERE id = ?`,
      )
      .run(positionSeconds, durationSeconds, itemId);

    return result.changes > 0;
  } finally {
    database.close();
  }
}

export function saveScanResults(
  path: string,
  collectionName: string,
  videos: ScannedVideo[],
  options: { createOnly?: boolean } = {},
) {
  initializeDatabase();

  const database = new DatabaseSync(databasePath);
  try {
    database.exec("BEGIN");

    if (
      options.createOnly &&
      database.prepare("SELECT 1 FROM scan_folders WHERE path = ?").get(path)
    ) {
      throw new Error("This folder is already part of a collection.");
    }

    database
      .prepare(
        options.createOnly
          ? "INSERT INTO scan_folders (path, collection_name) VALUES (?, ?)"
          : "INSERT INTO scan_folders (path, collection_name) VALUES (?, ?) ON CONFLICT(path) DO UPDATE SET collection_name = excluded.collection_name",
      )
      .run(path, collectionName);

    const collectionId = (database
      .prepare("SELECT id FROM scan_folders WHERE path = ?")
      .get(path) as { id: number }).id;

    const upsertItem = database.prepare(
      `INSERT INTO collections (
         collection_id, path, movie_name, movie_release_year, tmdb_id,
         overview, release_date, poster_path, backdrop_path, tmdb_rating,
         tmdb_last_fetched_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(collection_id, path) DO UPDATE SET
         movie_name = excluded.movie_name,
         movie_release_year = COALESCE(excluded.movie_release_year, collections.movie_release_year),
         tmdb_id = COALESCE(excluded.tmdb_id, collections.tmdb_id),
         overview = COALESCE(excluded.overview, collections.overview),
         release_date = COALESCE(excluded.release_date, collections.release_date),
         poster_path = COALESCE(excluded.poster_path, collections.poster_path),
         backdrop_path = COALESCE(excluded.backdrop_path, collections.backdrop_path),
         tmdb_rating = COALESCE(excluded.tmdb_rating, collections.tmdb_rating),
         tmdb_last_fetched_at = COALESCE(excluded.tmdb_last_fetched_at, collections.tmdb_last_fetched_at)`,
    );

    for (const video of videos) {
      upsertItem.run(
        collectionId,
        video.path,
        video.movieName,
        video.movieReleaseYear,
        video.tmdbId ?? null,
        video.overview ?? null,
        video.releaseDate ?? null,
        video.posterPath ?? null,
        video.backdropPath ?? null,
        video.tmdbRating ?? null,
        video.tmdbLastFetchedAt ?? null,
      );
    }

    if (videos.length) {
      const placeholders = videos.map(() => "?").join(", ");
      database
        .prepare(
          `DELETE FROM collections WHERE collection_id = ? AND path NOT IN (${placeholders})`,
        )
        .run(collectionId, ...videos.map((video) => video.path));
    } else {
      database
        .prepare("DELETE FROM collections WHERE collection_id = ?")
        .run(collectionId);
    }

    database.exec("COMMIT");
    return { collectionId, itemCount: videos.length };
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  } finally {
    database.close();
  }
}

export function deleteScanFolder(id: number) {
  initializeDatabase();

  const database = new DatabaseSync(databasePath);
  try {
    database.exec("BEGIN");
    database.prepare("DELETE FROM collections WHERE collection_id = ?").run(id);
    database.prepare("DELETE FROM scan_folders WHERE id = ?").run(id);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  } finally {
    database.close();
  }
}
