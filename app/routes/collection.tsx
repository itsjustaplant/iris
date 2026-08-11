import { ArrowsClockwiseIcon, FilmSlateIcon } from "@phosphor-icons/react";
import { useFetcher, useLoaderData } from "react-router";

import type { Route } from "./+types/collection";
import { Button } from "~/components/ui/button";
import {
  getCollection,
  getCollectionItems,
  saveScanResults,
} from "~/lib/database.server";
import { scanFolderForVideos } from "~/lib/media-scanner.server";
import { isLocalRequest } from "~/lib/request.server";
import { enrichVideosWithTmdb } from "~/lib/tmdb.server";

export function meta({ loaderData }: Route.MetaArgs) {
  const collectionName = loaderData?.collection.collectionName;

  return [
    { title: collectionName ? `${collectionName} | Iris` : "Iris" },
    {
      name: "description",
      content: collectionName
        ? `Browse movies in the ${collectionName} collection.`
        : "Browse your Iris movie collection.",
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const collectionId = Number(params.collectionId);

  if (!Number.isInteger(collectionId) || collectionId < 1) {
    throw new Response("Collection not found.", { status: 404 });
  }

  const collection = getCollection(collectionId);
  if (!collection) {
    throw new Response("Collection not found.", { status: 404 });
  }

  const isLocal = isLocalRequest(request);
  const items = getCollectionItems(collectionId).map((item) => ({
    ...item,
    displayName: item.movieName ?? item.path.split(/[\\/]/).pop() ?? "Untitled",
    path: isLocal ? item.path : null,
  }));

  return {
    collection: { ...collection, path: isLocal ? collection.path : null },
    items,
    isLocal,
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  if (!isLocalRequest(request)) {
    throw new Response("Collection rescanning is only available locally.", {
      status: 403,
    });
  }

  const collectionId = Number(params.collectionId);
  if (!Number.isInteger(collectionId) || collectionId < 1) {
    throw new Response("Collection not found.", { status: 404 });
  }

  const collection = getCollection(collectionId);
  if (!collection) {
    throw new Response("Collection not found.", { status: 404 });
  }

  try {
    const scan = await scanFolderForVideos(collection.path);
    const existingItems = getCollectionItems(collectionId);
    const videos = await enrichVideosWithTmdb(scan.videos, existingItems);
    const result = saveScanResults(
      scan.path,
      collection.collectionName,
      videos,
    );
    return { success: true, itemCount: result.itemCount };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "The collection could not be rescanned.",
    };
  }
}

export default function Collection() {
  const { collection, items, isLocal } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isRescanning = fetcher.state !== "idle";
  const rescanError =
    fetcher.data && "error" in fetcher.data ? fetcher.data.error : null;

  return (
    <main className="min-w-0 flex-1">
      <div>
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end p-5 sm:p-8">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {collection.collectionName}
            </h1>
            {collection.path && (
              <p className="mt-2 font-mono text-sm text-muted-foreground">
                {collection.path}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
            {isLocal && (
              <Button
                variant="outline"
                onClick={() => fetcher.submit(null, { method: "post" })}
                disabled={isRescanning}
              >
                <ArrowsClockwiseIcon
                  data-icon="inline-start"
                  className={isRescanning ? "animate-spin" : undefined}
                />
                {isRescanning ? "Rescanning…" : "Rescan"}
              </Button>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-8">
          {rescanError && (
            <p className="mb-4 text-xs text-destructive">{rescanError}</p>
          )}
          {items.length ? (
            <section className="mt-7 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((item) => (
                <article key={item.id} className="group min-w-0">
                  <div className="relative grid aspect-[2/3] w-full place-items-center overflow-hidden border border-border bg-card text-muted-foreground transition-colors group-hover:border-muted-foreground/50 group-hover:text-primary">
                    {item.posterPath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
                        alt={`${item.displayName} poster`}
                        className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : (
                      <>
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-br from-muted/80 via-card to-background"
                        />
                        <FilmSlateIcon
                          className="relative size-10 sm:size-12"
                          weight="duotone"
                        />
                      </>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent px-3 pb-3 pt-20 text-white sm:px-4 sm:pb-4 sm:pt-24">
                      <h2 className="line-clamp-2 text-sm font-semibold leading-snug drop-shadow-sm sm:text-base">
                        {item.displayName}
                      </h2>
                      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-white/75">
                        <span>
                          {item.releaseDate?.slice(0, 4) ??
                            item.movieReleaseYear ??
                            "Unknown year"}
                        </span>
                        <span>
                          {item.tmdbRating !== null
                            ? `${item.tmdbRating.toFixed(1)} / 10`
                            : item.movieProgress > 0
                              ? `${item.movieProgress}%`
                              : null}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <div className="mt-7 grid min-h-56 place-items-center border border-border bg-card p-6 text-center">
              <div>
                <FilmSlateIcon
                  size={28}
                  className="mx-auto text-primary"
                  weight="duotone"
                />
                <p className="mt-3 text-sm text-muted-foreground">
                  No items have been scanned in this collection yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
