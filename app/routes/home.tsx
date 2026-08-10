import { DotsThreeOutlineIcon, FlowerLotusIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useFetcher, useLoaderData } from "react-router";

import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import { FolderPicker } from "~/components/folder-picker";
import { addScanFolder, getScanFolders } from "~/lib/database.server";

export function meta() {
  return [
    { title: "Iris" },
    { name: "description", content: "A close-up study of an iris in bloom." },
  ];
}

export async function loader() {
  return { folders: getScanFolders() };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const path = formData.get("path");

  if (typeof path !== "string" || !path.trim()) {
    return { error: "A folder path is required." };
  }

  addScanFolder(path.trim());
  return { success: true };
}

export default function Home() {
  const { folders } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isFoldersEmpty = !folders?.length;
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const actionError =
    fetcher.data && "error" in fetcher.data ? fetcher.data.error : null;

  function handleNewCollection() {
    setPickerError(null);
    setIsFolderPickerOpen(true);
  }

  function handleFolderSelect(path: string) {
    fetcher.submit({ path }, { method: "post" });
  }

  return (
    <div className="relative isolate min-h-screen w-full max-w-[1920px] overflow-hidden bg-background text-foreground min-[1921px]:border min-[1921px]:border-border">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[min(72vh,48rem)] bg-cover bg-bottom bg-no-repeat opacity-55 grayscale-[40%] [mask-image:linear-gradient(to_top,#000_0%,#000_42%,transparent_100%)]"
        style={{ backgroundImage: "url('/iris.jpeg')" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[min(72vh,48rem)] bg-gradient-to-t from-transparent via-background/35 to-background"
      />

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-3">
          <img
            src="/iris-background-removed.png"
            alt="Iris"
            className="size-8 object-contain"
          />
          <span className="font-heading text-sm font-semibold tracking-tight">
            IRIS
          </span>
          <span className="hidden border-l border-border pl-3 text-xs text-muted-foreground sm:block">
            Workspace
          </span>
        </div>
      </header>
      <div className="flex">
        <main className="min-w-0 flex-1 p-5 sm:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
              <div>
                <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  Movies
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  A quiet place to keep your ideas in bloom.
                </p>
              </div>
              {isFoldersEmpty ? (
                <Button onClick={handleNewCollection}>
                  <PlusIcon size={16} weight="bold" data-icon="inline-start" />
                  New collection
                </Button>
              ) : (
                <Button onClick={handleNewCollection}>
                  <PlusIcon size={16} weight="bold" data-icon="inline-start" />
                  Refresh
                </Button>
              )}
            </div>
            {isFoldersEmpty ? (
              <div className="mt-7 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Pick a folder first to start building your library.
                </p>
                {(pickerError || actionError) && (
                  <p className="text-xs text-destructive">
                    {pickerError ?? actionError}
                  </p>
                )}
              </div>
            ) : (
              <>
                <section className="mt-7 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["Collections", "12", "Growing archive"],
                    ["Notes this week", "48", "+16% from last week"],
                    ["In bloom", "06", "Ideas in progress"],
                  ].map(([label, value, detail]) => (
                    <article key={label} className="bg-card p-5">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-5 font-heading text-3xl font-semibold">
                        {value}
                      </p>
                      <p className="mt-2 text-xs text-primary">{detail}</p>
                    </article>
                  ))}
                </section>

                <section className="mt-7 border border-border bg-card">
                  <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div>
                      <h2 className="text-sm font-semibold">Folders to scan</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Locations Iris will include in its library.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="More options"
                    >
                      <DotsThreeOutlineIcon size={18} weight="fill" />
                    </Button>
                  </div>
                  {folders.length > 0 ? (
                    <ul className="divide-y divide-border">
                      {folders.map((folder) => (
                        <li key={folder.id} className="px-5 py-3 text-sm">
                          {folder.path}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="grid min-h-44 place-items-center p-5 text-center">
                      <FlowerLotusIcon
                        size={26}
                        className="text-primary"
                        weight="duotone"
                      />
                      <p className="-mt-6 text-sm text-muted-foreground">
                        Choose a folder to begin scanning.
                      </p>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>
      <FolderPicker
        open={isFolderPickerOpen}
        onOpenChange={setIsFolderPickerOpen}
        onSelect={handleFolderSelect}
      />
    </div>
  );
}
