// Fetch helper for SERVER components (public pages). Cached and revalidated by Next, with a timeout so a
// sleeping Render instance can't hang a page. Never throws: pages decide what to show on failure.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export type ApiResult<T> = { data: T | null; status: number }; // status 0 = network failure/timeout

export async function apiGet<T = any>(path: string, revalidate = 300): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { data: null, status: res.status };
    const json = await res.json();
    return { data: (json.data ?? null) as T | null, status: res.status };
  } catch {
    return { data: null, status: 0 };
  }
}
