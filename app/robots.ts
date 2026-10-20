import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public pages are open to everyone, including AI search and answer assistants, so people asking an assistant about
// hospitals in Kisumu can be pointed to Lisa Hospitals. The signed-in areas and the API are closed to all crawlers.
const PRIVATE = ["/staff/", "/admin/", "/patient/", "/api/", "/auth/", "/pay/", "/complete-profile", "/login", "/register", "/sign-in", "/sign-up"];

// Named so the policy for each is explicit and easy to change: remove a name from this list to block it.
const AI_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",          // OpenAI (training, search, user-requested browsing)
  "ClaudeBot", "Claude-SearchBot", "Claude-User",     // Anthropic
  "PerplexityBot", "Perplexity-User",                 // Perplexity
  "Google-Extended", "Applebot-Extended",             // Gemini / Apple Intelligence training controls
  "Bingbot", "Googlebot", "DuckDuckBot", "Bytespider", "CCBot", "Amazonbot", "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
