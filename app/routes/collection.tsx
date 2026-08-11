import { FilmSlateIcon } from "@phosphor-icons/react";
import { useLoaderData } from "react-router";

import type { Route } from "./+types/collection";
import { getCollection, getCollectionItems } from "~/lib/database.server";
import { isLocalRequest } from "~/lib/request.server";

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
  };
}

export default function Collection() {
  const { collection, items } = useLoaderData<typeof loader>();

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
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="p-5 sm:p-8">
          {items.length ? (
            <section className="mt-7 divide-y divide-border border border-border bg-card">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex items-center gap-4 p-4 sm:p-5"
                >
                  <div className="grid size-10 shrink-0 place-items-center bg-muted text-primary">
                    <FilmSlateIcon size={20} weight="duotone" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-medium">
                      {item.displayName}
                    </h2>
                    {item.path && (
                      <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                        {item.path}
                      </p>
                    )}
                  </div>
                  <div className="hidden text-right text-xs text-muted-foreground sm:block">
                    <p>{item.movieReleaseYear ?? "Unknown year"}</p>
                    <p className="mt-1">Progress: {item.movieProgress}</p>
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
