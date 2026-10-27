"use client";

import { useCallback, useEffect, useState } from "react";
import { friendlyError } from "@/lib/utils";

/**
 * Tiny data-loading hook: gives every page the same loading / error / retry
 * behaviour without pulling in a data library.
 * Pass a stable function (e.g. one imported from lib/db.ts).
 */
export function useQuery<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (e) {
      setError(friendlyError(e, "We couldn't load your data."));
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, setData, loading, error, reload };
}
