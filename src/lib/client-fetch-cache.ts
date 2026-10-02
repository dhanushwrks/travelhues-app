type CacheEntry = { at: number; data: unknown };

const store = new Map<string, CacheEntry>();

/** Short-lived client cache for identical search/creator list queries. */
export async function cachedClientGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 30_000,
): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
  const data = await fetcher();
  store.set(key, { at: Date.now(), data });
  return data;
}

export function invalidateClientFetchCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
