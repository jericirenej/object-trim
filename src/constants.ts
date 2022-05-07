import type { ValidTypes } from "./types.js";

export const VALID_FILTER_TYPES: ValidTypes[] = Array.from(
  new Set(["exclude", "include"])
);
