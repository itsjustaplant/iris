import { basename, extname } from "node:path";

export type ParsedVideoFilename = {
  movieName: string;
  movieReleaseYear: number | null;
};

const RELEASE_MARKER =
  /\b(?:360p|480p|576p|720p|1080[pi]?|2160p|4320p|4k|8k|uhd|blu[ .-]?ray|b[dr]rip|web[ .-]?(?:dl|rip)|webrip|hdtv|dvd[ .-]?rip|remux|x26[45]|h[ .-]?26[45]|hevc|av1|xvid|divx|hdr10\+?|hdr|dolby[ .-]?vision|aac|ac3|eac3|ddp?\d?(?:\.\d)?|dts(?:[ .-]?hd)?|truehd|atmos|proper|repack|extended|unrated|director'?s[ .-]?cut|limited|multi|dual[ .-]?audio)\b/i;

/** Extracts a readable movie title and release year from a torrent-style filename. */
export function parseVideoFilename(filename: string): ParsedVideoFilename {
  const extension = extname(filename);
  const stem = basename(filename, extension);
  const normalized = stem
    .replace(/[._]+/g, " ")
    .replace(/[()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const yearMatches = [
    ...normalized.matchAll(/\b(?:18\d{2}|19\d{2}|20\d{2})\b/g),
  ];
  const yearMatch = yearMatches.at(-1);
  let movieReleaseYear: number | null = null;
  let titleEnd = normalized.length;

  if (yearMatch?.index !== undefined) {
    const possibleTitle = normalized.slice(0, yearMatch.index).trim();
    // A filename such as "1917.mkv" is a title, not enough evidence for a year.
    if (possibleTitle) {
      movieReleaseYear = Number(yearMatch[0]);
      titleEnd = yearMatch.index;
    }
  }

  if (movieReleaseYear === null) {
    const marker = RELEASE_MARKER.exec(normalized);
    if (marker?.index !== undefined && marker.index > 0) {
      titleEnd = marker.index;
    }
  }

  let movieName = normalized
    .slice(0, titleEnd)
    .replace(/[\s-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!movieName) movieName = normalized || stem;
  if (movieName === movieName.toLowerCase()) {
    movieName = movieName.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
  }

  return { movieName, movieReleaseYear };
}
