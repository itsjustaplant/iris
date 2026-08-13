import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef } from "react";
import { Link } from "react-router";

import type { Route } from "./+types/movie";
import { getCollection, getCollectionItem } from "~/lib/database.server";

type SubtitleTrack = {
  src: string;
  srcLang: string;
  label: string;
  default?: boolean;
};

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: loaderData ? `${loaderData.movie.displayName} | Iris` : "Movie | Iris" },
    {
      name: "description",
      content: loaderData?.movie.overview ?? "Watch a movie from your Iris library.",
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const collectionId = Number(params.collectionId);
  const movieId = Number(params.movieId);

  if (
    !Number.isInteger(collectionId) ||
    collectionId < 1 ||
    !Number.isInteger(movieId) ||
    movieId < 1
  ) {
    throw new Response("Movie not found.", { status: 404 });
  }

  const collection = getCollection(collectionId);
  const item = getCollectionItem(collectionId, movieId);
  if (!collection || !item) {
    throw new Response("Movie not found.", { status: 404 });
  }

  return {
    collection: { id: collection.id, collectionName: collection.collectionName },
    movie: {
      id: item.id,
      displayName: item.movieName ?? item.path.split(/[\\/]/).pop() ?? "Untitled",
      overview: item.overview,
      releaseYear: item.releaseDate?.slice(0, 4) ?? item.movieReleaseYear,
      rating: item.tmdbRating,
      posterPath: item.posterPath,
      backdropPath: item.backdropPath,
      progressSeconds: item.movieProgress,
      durationSeconds: item.movieLength,
    },
    subtitleTracks: [] as SubtitleTrack[],
  };
}

export default function Movie({ loaderData }: Route.ComponentProps) {
  const { collection, movie, subtitleTracks } = loaderData;
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedPositionRef = useRef(movie.progressSeconds);
  const poster = movie.posterPath
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : undefined;

  const saveProgress = useCallback(
    (force = false, useBeacon = false) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.currentTime) || !Number.isFinite(video.duration)) {
        return;
      }

      const positionSeconds = Math.max(0, Math.floor(video.currentTime));
      const durationSeconds = Math.max(0, Math.floor(video.duration));
      if (!durationSeconds) return;

      if (!force && Math.abs(positionSeconds - lastSavedPositionRef.current) < 2) {
        return;
      }

      lastSavedPositionRef.current = positionSeconds;
      const body = new URLSearchParams({
        positionSeconds: String(positionSeconds),
        durationSeconds: String(durationSeconds),
      });
      const url = `/api/movies/${movie.id}/progress`;

      if (useBeacon && navigator.sendBeacon(url, body)) return;

      void fetch(url, {
        method: "POST",
        body,
        keepalive: useBeacon,
      }).catch(() => {
        // A later checkpoint or lifecycle event will send the latest position.
      });
    },
    [movie.id],
  );

  useEffect(() => {
    lastSavedPositionRef.current = movie.progressSeconds;
  }, [movie.id, movie.progressSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const checkpoint = window.setInterval(() => {
      if (!video.paused && !video.ended) saveProgress();
    }, 10_000);
    const handlePause = () => saveProgress(true);
    const handleSeeked = () => saveProgress(true);
    const handleEnded = () => saveProgress(true);
    const handlePageHide = () => saveProgress(true, true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") saveProgress(true, true);
    };

    video.addEventListener("pause", handlePause);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("ended", handleEnded);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      saveProgress(true, true);
      window.clearInterval(checkpoint);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("ended", handleEnded);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [saveProgress]);

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video || movie.progressSeconds <= 0) return;

    const savedDuration = movie.durationSeconds ?? video.duration;
    const isNearlyFinished =
      savedDuration > 0 && movie.progressSeconds / savedDuration >= 0.95;
    if (!isNearlyFinished && movie.progressSeconds < video.duration) {
      video.currentTime = movie.progressSeconds;
    }
  }

  return (
    <main className="min-w-0 flex-1">
      <div className="border-b border-border p-5 sm:p-8">
        <Link
          to={`/collections/${collection.id}`}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon size={15} />
          Back to {collection.collectionName}
        </Link>
      </div>

      <section className="p-5 sm:p-8">
        <div className="overflow-hidden border border-border bg-black shadow-2xl">
          <video
            ref={videoRef}
            className="aspect-video w-full bg-black object-contain"
            controls
            playsInline
            preload="metadata"
            poster={poster}
            onLoadedMetadata={handleLoadedMetadata}
          >
            <source src={`/api/movies/${movie.id}/stream`} />
            {subtitleTracks.map((track) => (
              <track
                key={`${track.srcLang}-${track.label}`}
                kind="subtitles"
                src={track.src}
                srcLang={track.srcLang}
                label={track.label}
                default={track.default}
              />
            ))}
            Your browser does not support HTML video playback.
          </video>
        </div>

        <div className="mt-7 max-w-3xl">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {movie.displayName}
          </h1>
          <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
            {movie.releaseYear && <span>{movie.releaseYear}</span>}
            {movie.rating !== null && <span>{movie.rating.toFixed(1)} / 10</span>}
          </div>
          {movie.overview && (
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              {movie.overview}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
