import type { Route } from "./+types/api.movie-progress";
import {
  getCollectionItemById,
  updateMovieProgress,
} from "~/lib/database.server";

export async function action({ params, request }: Route.ActionArgs) {
  const movieId = Number(params.movieId);
  if (!Number.isInteger(movieId) || movieId < 1 || !getCollectionItemById(movieId)) {
    return Response.json({ error: "Movie not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const positionSeconds = Number(formData.get("positionSeconds"));
  const durationSeconds = Number(formData.get("durationSeconds"));

  if (
    !Number.isFinite(positionSeconds) ||
    !Number.isFinite(durationSeconds) ||
    positionSeconds < 0 ||
    durationSeconds <= 0
  ) {
    return Response.json({ error: "Invalid movie progress." }, { status: 400 });
  }

  const duration = Math.floor(durationSeconds);
  const position = Math.min(Math.floor(positionSeconds), duration);
  updateMovieProgress(movieId, position, duration);

  return Response.json({ success: true, positionSeconds: position });
}
