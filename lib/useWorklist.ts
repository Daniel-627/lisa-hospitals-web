"use client";

import { useEffect, useState } from "react";
import { errMsg } from "@/lib/format";

/**
 * Loads a list, refreshes it every `intervalMs`, and shows "loading" only when the filter (`key`) changes,
 * so a background refresh never flashes a spinner.
 */
export function useWorklist<T = any>(fetcher: () => Promise<{ data: { data: T[] } }>, key: string, intervalMs = 30000) {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<{ key: string; rows: T[]; error: string } | null>(null);

  useEffect(() => {
    const iv = setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => clearInterval(iv);
  }, [intervalMs]);

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then(({ data }) => { if (!cancelled) setResult({ key, rows: data.data, error: "" }); })
      .catch((err) => { if (!cancelled) setResult((r) => ({ key, rows: r?.key === key ? r.rows : [], error: errMsg(err, "Couldn't load the list.") })); });
    return () => { cancelled = true; };
  }, [key, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = result?.key === key ? result : null;
  return { rows: current?.rows ?? ([] as T[]), loading: !current, error: current?.error ?? "", reload: () => setTick((n) => n + 1) };
}
