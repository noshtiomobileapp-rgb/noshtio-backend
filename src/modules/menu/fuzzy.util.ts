// src/modules/menu/fuzzy.util.ts

import Fuse from "fuse.js";
import type { IFuseOptions } from "fuse.js";

export function buildFuseIndex<T>(
  items: T[],
  opts?: Partial<IFuseOptions<T>>
) {
  const defaultOpts: IFuseOptions<T> = {
    keys: ["name", "aliases", "description"] as any,
    threshold: 0.35,
    distance: 100,
    ignoreLocation: true,
  };

  return new Fuse(
    items,
    { ...defaultOpts, ...(opts || {}) }
  );
}
