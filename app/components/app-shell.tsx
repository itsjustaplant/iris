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
    | { collection?: { collectionName?: string } }
    | undefined;
  const collectionName = collection?.collection?.collectionName;

  return (
    <div className="relative isolate min-h-dvh w-full max-w-[1180px] overflow-x-hidden bg-background text-foreground min-[1181px]:border min-[1181px]:border-border">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[min(42vh,48rem)] max-w-[1180px] bg-cover bg-top-right bg-no-repeat opacity-55 grayscale-40 [mask-image:linear-gradient(to_top,#000_0%,#000_42%,transparent_100%)]"
        style={{ backgroundImage: "url('/iris.jpeg')" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[min(42vh,48rem)] max-w-[1180px] bg-gradient-to-t from-transparent via-background/35 to-background"
      />

      <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-3">
          <img
            src="/iris-background-removed.png"
            alt="Iris"
            className="size-8 object-contain"
          />
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
                    <BreadcrumbPage className="max-w-48 sm:max-w-80">
                      {collectionName}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
