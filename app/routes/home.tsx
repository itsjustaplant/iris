import { FlowerLotusIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useFetcher, useLoaderData } from "react-router";

import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import { FolderPicker } from "~/components/folder-picker";
import {
  addScanFolder,
  deleteScanFolder,
  getItemCount,
  getScanFolders,
} from "~/lib/database.server";

export function meta() {
  return [
    { title: "Iris" },
    { name: "description", content: "A close-up study of an iris in bloom." },
  ];
}

export async function loader() {
  return { folders: getScanFolders(), itemCount: getItemCount() };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const id = Number(formData.get("id"));

    if (!Number.isInteger(id) || id < 1) {
      return { error: "A valid folder record is required." };
    }

    deleteScanFolder(id);
    return { success: true };
  }

  const path = formData.get("path");
  const collectionName = formData.get("collectionName");

  if (
    typeof path !== "string" ||
    !path.trim() ||
    typeof collectionName !== "string" ||
    !collectionName.trim()
  ) {
    return { error: "A collection name and folder path are required." };
  }

  addScanFolder(path.trim(), collectionName.trim());
  return { success: true };
}

export default function Home() {
  const { folders, itemCount } = useLoaderData<typeof loader>();
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

  function handleFolderSelect(path: string, collectionName: string) {
    fetcher.submit({ intent: "add", path, collectionName }, { method: "post" });
  }

  function handleDeleteFolder(id: number) {
    fetcher.submit({ intent: "delete", id }, { method: "post" });
  }

  return (
    <>
      <main className="min-w-0 flex-1">
          <div>
            <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end p-5 sm:p-8">
              <div>
                <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  Collections
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your personal library of films, ready to watch.
                </p>
              </div>
              <Button onClick={handleNewCollection}>
                <PlusIcon size={16} weight="bold" data-icon="inline-start" />
                New collection
              </Button>
            </div>
            {isFoldersEmpty ? (
              <div className="mt-7 space-y-2 p-5 sm:p-8">
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
              <div className="p-5 sm:p-8">
                <section className="mt-7 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-2">
                  {[
                    ["Collections", folders.length || 0, "Growing archive"],
                    ["Items", itemCount, "Across all collections"],
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
                  </div>
                  {folders.length > 0 ? (
                    <ul className="divide-y divide-border">
                      {folders.map((folder) => (
                        <li
                          key={folder.id}
                          className="flex items-center justify-between gap-4 px-5 py-3"
                        >
                          <Link
                            to={`/collections/${folder.id}`}
                            className="min-w-0 flex-1 text-sm"
                          >
                            <p>{folder.collectionName}</p>
                            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                              {folder.path}
                            </p>
                            <p className="mt-1 text-xs text-primary">
                              {folder.itemCount} items
                            </p>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${folder.collectionName}`}
                            onClick={() => handleDeleteFolder(folder.id)}
                          >
                            <TrashIcon size={17} />
                          </Button>
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
              </div>
            )}
          </div>
      </main>
      <FolderPicker
        open={isFolderPickerOpen}
        onOpenChange={setIsFolderPickerOpen}
        onSelect={handleFolderSelect}
      />
    </>
  );
}
