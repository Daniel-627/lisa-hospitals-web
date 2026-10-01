// Bridges Clerk's getToken() (a React hook) to non-React code such as the axios interceptor.
type Getter = (opts?: { skipCache?: boolean }) => Promise<string | null>;
let getter: Getter | null = null;

export const registerTokenGetter = (g: Getter | null) => { getter = g; };

/** Always returns a fresh-enough Clerk session token (Clerk caches and refreshes them itself). */
export async function getAuthToken(opts?: { skipCache?: boolean }): Promise<string | null> {
  // TokenProvider registers on mount; wait briefly if a request fires first.
  for (let i = 0; i < 20 && !getter; i++) await new Promise((r) => setTimeout(r, 50));
  return getter ? getter(opts) : null;
}
