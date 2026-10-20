// The one place that says where the site lives. Set NEXT_PUBLIC_SITE_URL in Vercel (Project → Settings → Environment
// Variables) to change the main address, for example when the .com becomes the main one. Every canonical link, sitemap
// entry, social card and structured-data URL follows it, and the other domain is redirected to it (see next.config.ts).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://lisahospitals.co.ke").replace(/\/+$/, "");

/** Both domains and their www versions. Anything that is not the main address is redirected to it. */
export const SITE_HOSTS = ["lisahospitals.co.ke", "www.lisahospitals.co.ke", "lisahospitals.com", "www.lisahospitals.com"];

export const abs = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
