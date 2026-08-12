import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("collections/:collectionId", "routes/collection.tsx"),
  route("collections/:collectionId/movies/:movieId", "routes/movie.tsx"),
  route("api/movies/:movieId/stream", "routes/api.movie-stream.ts"),
  route("api/folders", "routes/api.folders.ts"),
] satisfies RouteConfig;
