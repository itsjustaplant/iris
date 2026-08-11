import type { ScannedVideo } from "~/lib/media-scanner.server";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const LOOKUP_CONCURRENCY = 4;
const TMDB_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000;

export type CachedTmdbVideo = {
  path: string;
  movieName: string | null;
  movieReleaseYear: number | null;
  tmdbId: number | null;
  overview: string | null;
  releaseDate: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  tmdbRating: number | null;
  tmdbLastFetchedAt: string | null;
};

type TmdbSearchMovie = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
};

type TmdbSearchResponse = {
  results: TmdbSearchMovie[];
};

function comparableTitle(title: string) {
  return title.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function withCachedMetadata(
  video: ScannedVideo,
  cached: CachedTmdbVideo | undefined,
): ScannedVideo {
  if (!cached) return video;
  return {
    ...video,
    movieName: cached.movieName ?? video.movieName,
    movieReleaseYear: cached.movieReleaseYear ?? video.movieReleaseYear,
    tmdbId: cached.tmdbId ?? undefined,
    overview: cached.overview,
    releaseDate: cached.releaseDate,
    posterPath: cached.posterPath,
    backdropPath: cached.backdropPath,
    tmdbRating: cached.tmdbRating ?? undefined,
    tmdbLastFetchedAt: cached.tmdbLastFetchedAt ?? undefined,
  };
}

function hasFreshTmdbMetadata(cached: CachedTmdbVideo | undefined) {
  if (!cached?.tmdbId || !cached.tmdbLastFetchedAt) return false;
  const fetchedAt = Date.parse(cached.tmdbLastFetchedAt);
  return Number.isFinite(fetchedAt) && Date.now() - fetchedAt < TMDB_MAX_AGE_MS;
}

async function findMovie(
  video: ScannedVideo,
  cached: CachedTmdbVideo | undefined,
): Promise<ScannedVideo> {
  const token = process.env.TMDB_API_READ_TOKEN?.trim();
  if (!token) return withCachedMetadata(video, cached);

  const search = new URLSearchParams({
    query: video.movieName,
    include_adult: "false",
    language: "en-US",
  });
  if (video.movieReleaseYear) {
    search.set("primary_release_year", String(video.movieReleaseYear));
  }

  try {
    const response = await fetch(`${TMDB_API_URL}/search/movie?${search}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return withCachedMetadata(video, cached);

    const data = (await response.json()) as TmdbSearchResponse;
    const expectedTitle = comparableTitle(video.movieName);
    const match = data.results.find((movie) => {
      const titleMatches =
        comparableTitle(movie.title) === expectedTitle ||
        comparableTitle(movie.original_title) === expectedTitle;
      const releaseYear = Number(movie.release_date.slice(0, 4));
      const yearMatches =
        video.movieReleaseYear === null || releaseYear === video.movieReleaseYear;
      return titleMatches && yearMatches;
    });

    if (!match) return withCachedMetadata(video, cached);

    return {
      ...video,
      movieName: match.title,
      movieReleaseYear: match.release_date
        ? Number(match.release_date.slice(0, 4))
        : video.movieReleaseYear,
      tmdbId: match.id,
      overview: match.overview || null,
      releaseDate: match.release_date || null,
      posterPath: match.poster_path,
      backdropPath: match.backdrop_path,
      tmdbRating: match.vote_average,
      tmdbLastFetchedAt: new Date().toISOString(),
    };
  } catch {
    return withCachedMetadata(video, cached);
  }
}

/** Adds TMDB metadata without failing the underlying filesystem scan. */
export async function enrichVideosWithTmdb(
  videos: ScannedVideo[],
  cachedVideos: CachedTmdbVideo[] = [],
): Promise<ScannedVideo[]> {
  const cachedByPath = new Map(cachedVideos.map((video) => [video.path, video]));
  const videosNeedingLookup = videos.filter(
    (video) => !hasFreshTmdbMetadata(cachedByPath.get(video.path)),
  );
  const enrichedByPath = new Map(
    videos
      .filter((video) => hasFreshTmdbMetadata(cachedByPath.get(video.path)))
      .map((video) => [
        video.path,
        withCachedMetadata(video, cachedByPath.get(video.path)),
      ]),
  );

  for (
    let index = 0;
    index < videosNeedingLookup.length;
    index += LOOKUP_CONCURRENCY
  ) {
    const batch = videosNeedingLookup.slice(index, index + LOOKUP_CONCURRENCY);
    const results = await Promise.all(
      batch.map((video) => findMovie(video, cachedByPath.get(video.path))),
    );
    for (const result of results) enrichedByPath.set(result.path, result);
  }

  return videos.map((video) => enrichedByPath.get(video.path) ?? video);
}
