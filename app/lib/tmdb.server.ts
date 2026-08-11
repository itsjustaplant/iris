import type { ScannedVideo } from "~/lib/media-scanner.server";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const LOOKUP_CONCURRENCY = 4;

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

async function findMovie(video: ScannedVideo): Promise<ScannedVideo> {
  const token = process.env.TMDB_API_READ_TOKEN?.trim();
  if (!token) return video;

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
    if (!response.ok) return video;

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

    if (!match) return video;

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
    };
  } catch {
    return video;
  }
}

/** Adds TMDB metadata without failing the underlying filesystem scan. */
export async function enrichVideosWithTmdb(
  videos: ScannedVideo[],
): Promise<ScannedVideo[]> {
  if (!process.env.TMDB_API_READ_TOKEN?.trim()) return videos;

  const enriched: ScannedVideo[] = [];
  for (let index = 0; index < videos.length; index += LOOKUP_CONCURRENCY) {
    enriched.push(
      ...(await Promise.all(
        videos.slice(index, index + LOOKUP_CONCURRENCY).map(findMovie),
      )),
    );
  }
  return enriched;
}
