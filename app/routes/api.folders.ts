import { readdir, realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

type Folder = {
  name: string;
  path: string;
};

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const rootPath = await realpath(homedir());
  const requestedPath = url.searchParams.get("path");
  const path = requestedPath ? resolve(requestedPath) : rootPath;

  try {
    const currentPath = await realpath(path);
    const relativePath = relative(rootPath, currentPath);

    if (
      relativePath.startsWith("..") ||
      isAbsolute(relativePath)
    ) {
      return {
        currentPath: rootPath,
        parentPath: null,
        folders: [],
        error: "Choose a folder inside your home directory.",
      };
    }

    const directory = await stat(currentPath);

    if (!directory.isDirectory()) {
      return { currentPath, parentPath: null, folders: [], error: "Not a folder." };
    }

    const entries = await readdir(currentPath, { withFileTypes: true });
    const folders: Folder[] = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => ({ name: entry.name, path: join(currentPath, entry.name) }))
      .sort((left, right) => left.name.localeCompare(right.name));

    return {
      currentPath,
      parentPath: currentPath === rootPath ? null : dirname(currentPath),
      folders,
    };
  } catch {
    return {
      currentPath: path,
      parentPath: null,
      folders: [],
      error: "This folder cannot be opened.",
    };
  }
}
