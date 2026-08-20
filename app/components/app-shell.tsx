import type { ReactNode } from "react";
import { useMatches } from "react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { ThemeToggle } from "~/components/theme-toggle";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const matches = useMatches();
  const collectionMatch = matches.find(
    (match) =>
      typeof match.loaderData === "object" &&
      match.loaderData !== null &&
      "collection" in match.loaderData,
  );
  const collection = collectionMatch?.loaderData as
    { collection?: { collectionName?: string } } | undefined;
  const collectionName = collection?.collection?.collectionName;
  const movie = collectionMatch?.loaderData as
    | { movie?: { displayName?: string }; collection?: { id?: number } }
    | undefined;
  const movieName = movie?.movie?.displayName;
  const collectionId = movie?.collection?.id;

  return (
    <div className="relative isolate flex min-h-dvh w-full max-w-[1180px] flex-col overflow-x-hidden bg-background text-foreground min-[1181px]:border min-[1181px]:border-border">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[min(42vh,48rem)] max-w-[1180px] bg-cover bg-top-right bg-no-repeat opacity-75 grayscale-0 [mask-image:linear-gradient(to_top,#000_0%,#000_42%,transparent_100%)] dark:opacity-55 dark:grayscale-40"
        style={{ backgroundImage: "url('/iris.jpeg')" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[min(42vh,48rem)] max-w-[1180px] bg-gradient-to-t from-transparent via-background/35 to-background"
      />

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-heading text-sm font-semibold tracking-tight">
            IRIS
          </span>
          <Breadcrumb className="min-w-0 border-l border-border pl-3">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem>
                {collectionName ? (
                  <BreadcrumbLink to="/">Collections</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>Collections</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {collectionName && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="min-w-0">
                    {movieName && collectionId ? (
                      <BreadcrumbLink to={`/collections/${collectionId}`}>
                        {collectionName}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="max-w-48 sm:max-w-80">
                        {collectionName}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </>
              )}
              {movieName && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className="max-w-40 sm:max-w-72">
                      {movieName}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <ThemeToggle />
      </header>

      <div className="relative z-10 flex-1">{children}</div>

      <footer className="relative z-10 mt-auto flex min-h-16 items-end justify-end px-5 py-4 text-right sm:px-8">
        <p className="max-w-md bg-background/75 px-2 py-1 text-[10px] leading-relaxed text-foreground/85 shadow-sm backdrop-blur-sm">
          This product uses the{" "}
          <a
            href="https://www.themoviedb.org"
            className="underline underline-offset-4 transition-colors hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            TMDB API
          </a>{" "}
          but is not endorsed or certified by TMDB.
        </p>
      </footer>
    </div>
  );
}
