import { CaretUpIcon, FolderIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

type Folder = {
  name: string;
  path: string;
};

type FolderResponse = {
  currentPath: string;
  parentPath: string | null;
  folders: Folder[];
  error?: string;
};

type FolderPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (path: string, collectionName: string) => void;
};

export function FolderPicker({
  open,
  onOpenChange,
  onSelect,
}: FolderPickerProps) {
  const [path, setPath] = useState<string | null>(null);
  const [data, setData] = useState<FolderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [collectionName, setCollectionName] = useState("");

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const query = path ? `?path=${encodeURIComponent(path)}` : "";

    async function loadFolders() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/folders${query}`, {
          signal: controller.signal,
        });
        const nextData = (await response.json()) as FolderResponse;
        setData(nextData);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setData({
          currentPath: path ?? "",
          parentPath: null,
          folders: [],
          error: "Could not load folders.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadFolders();
    return () => controller.abort();
  }, [open, path]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setPath(null);
      setCollectionName("");
    }
    onOpenChange(nextOpen);
  }

  function handleSelect() {
    if (!data?.currentPath || data.error) return;
    onSelect(data.currentPath, collectionName.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl gap-0 p-0" showCloseButton={false}>
        <DialogHeader className="border-b border-border p-5 pr-12">
          <DialogTitle>Choose a folder</DialogTitle>
          <DialogDescription>
            Browse folders and select the location Iris should scan.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-border p-4">
          <label
            htmlFor="collection-name"
            className="mb-2 block text-xs font-medium"
          >
            Collection name
          </label>
          <Input
            id="collection-name"
            value={collectionName}
            onChange={(event) => setCollectionName(event.target.value)}
            placeholder="e.g. Family films"
          />
        </div>

        <div className="border-b border-border px-5 py-3 font-mono text-xs text-muted-foreground break-all">
          {data?.currentPath ?? "Loading root…"}
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {data?.parentPath && (
            <button
              type="button"
              onClick={() => setPath(data.parentPath)}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <CaretUpIcon size={16} />
              Parent folder
            </button>
          )}
          {isLoading ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Loading folders…
            </p>
          ) : data?.error ? (
            <p className="px-3 py-8 text-center text-sm text-destructive">
              {data.error}
            </p>
          ) : data?.folders.length ? (
            data.folders.map((folder) => (
              <button
                key={folder.path}
                type="button"
                onClick={() => setPath(folder.path)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <FolderIcon
                  size={18}
                  className="text-primary"
                  weight="duotone"
                />
                <span className="truncate">{folder.name}</span>
              </button>
            ))
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No folders here.
            </p>
          )}
        </div>

        <DialogFooter className="border-t border-border p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={
              !data?.currentPath ||
              !collectionName.trim() ||
              Boolean(data.error) ||
              isLoading
            }
          >
            Select this folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
