import { readdir, realpath, stat } from "node:fs/promises";
import { extname, join } from "node:path";

import { parseVideoFilename } from "~/lib/video-filename";

const VIDEO_EXTENSIONS = new Set([
  ".3gp",
  ".avi",
  ".flv",
  ".m2ts",
  ".m4v",
  ".mkv",
  ".mov",
  ".mp4",
  ".mpeg",
  ".mpg",
  ".mts",
  ".ogv",
  ".ts",
  ".webm",
  ".wmv",
]);

export type ScannedVideo = {
  path: string;
  movieName: string;
  movieReleaseYear: number | null;
  tmdbId?: number;
  overview?: string | null;
  releaseDate?: string | null;
  posterPath?: string | null;
  backdropPath?: string | null;
  tmdbRating?: number;
  tmdbLastFetchedAt?: string;
};

export type FolderScanResult = {
  path: string;
  videos: ScannedVideo[];
};

/** Recursively finds video files without following symbolic-link directories. */
export async function scanFolderForVideos(path: string): Promise<FolderScanResult> {
  const rootPath = await resolveScanFolderPath(path);
  const videos: FolderScanResult["videos"] = [];
  const directories = [rootPath];

  while (directories.length) {
    const currentPath = directories.pop();
    if (!currentPath) break;

    let entries;
    try {
      entries = await readdir(currentPath, { withFileTypes: true });
    } catch {
      // A single unreadable subfolder should not prevent the rest of the scan.
      if (currentPath === rootPath) throw new Error("The selected folder cannot be read.");
      continue;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;

      const entryPath = join(currentPath, entry.name);
      if (entry.isDirectory()) {
        directories.push(entryPath);
      } else if (entry.isFile() && VIDEO_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        videos.push({ path: entryPath, ...parseVideoFilename(entry.name) });
      }
    }
  }

  videos.sort((left, right) => left.path.localeCompare(right.path));
  return { path: rootPath, videos };
}

export async function resolveScanFolderPath(path: string) {
  const rootPath = await realpath(path);
  const root = await stat(rootPath);

  if (!root.isDirectory()) {
    throw new Error("The selected path is not a folder.");
  }
  return rootPath;
}
