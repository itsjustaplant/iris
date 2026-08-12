import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname } from "node:path";
import { Readable } from "node:stream";

import type { Route } from "./+types/api.movie-stream";
import { getCollectionItemById } from "~/lib/database.server";

const CONTENT_TYPES: Record<string, string> = {
  ".m4v": "video/mp4",
  ".mkv": "video/x-matroska",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".mpeg": "video/mpeg",
  ".mpg": "video/mpeg",
  ".ogv": "video/ogg",
  ".webm": "video/webm",
  ".avi": "video/x-msvideo",
  ".wmv": "video/x-ms-wmv",
  ".ts": "video/mp2t",
  ".m2ts": "video/mp2t",
  ".mts": "video/mp2t",
};

export async function loader({ params, request }: Route.LoaderArgs) {
  const movieId = Number(params.movieId);
  if (!Number.isInteger(movieId) || movieId < 1) {
    return new Response("Movie not found.", { status: 404 });
  }

  const movie = getCollectionItemById(movieId);
  if (!movie) return new Response("Movie not found.", { status: 404 });

  let file;
  try {
    file = await stat(movie.path);
  } catch {
    return new Response("Movie file not found.", { status: 404 });
  }
  if (!file.isFile()) return new Response("Movie file not found.", { status: 404 });

  const contentType = CONTENT_TYPES[extname(movie.path).toLowerCase()] ?? "application/octet-stream";
  const range = request.headers.get("range");
  const commonHeaders = {
    "Accept-Ranges": "bytes",
    "Content-Type": contentType,
    "Cache-Control": "private, no-store",
  };

  if (!range) {
    const stream = Readable.toWeb(createReadStream(movie.path));
    return new Response(stream as BodyInit, {
      headers: { ...commonHeaders, "Content-Length": String(file.size) },
    });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) {
    return new Response(null, {
      status: 416,
      headers: { ...commonHeaders, "Content-Range": `bytes */${file.size}` },
    });
  }

  const start = match[1] ? Number(match[1]) : Math.max(0, file.size - Number(match[2]));
  let end = match[2] && match[1] ? Number(match[2]) : file.size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= file.size) {
    return new Response(null, {
      status: 416,
      headers: { ...commonHeaders, "Content-Range": `bytes */${file.size}` },
    });
  }
  end = Math.min(end, file.size - 1);

  const stream = Readable.toWeb(createReadStream(movie.path, { start, end }));
  return new Response(stream as BodyInit, {
    status: 206,
    headers: {
      ...commonHeaders,
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${file.size}`,
    },
  });
}
