import { ArrowLeftIcon } from "@phosphor-icons/react";
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
    },
    subtitleTracks: [] as SubtitleTrack[],
  };
}

export default function Movie({ loaderData }: Route.ComponentProps) {
  const { collection, movie, subtitleTracks } = loaderData;
  const poster = movie.posterPath
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : undefined;

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
            className="aspect-video w-full bg-black object-contain"
            controls
            playsInline
            preload="metadata"
            poster={poster}
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
