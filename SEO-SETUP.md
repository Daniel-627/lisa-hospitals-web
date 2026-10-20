# SEO, AI search and domains: what is done and what you do by hand

## Already in the code
- Every public page has its own title, description, canonical address and share picture (WhatsApp, Facebook, X, LinkedIn).
- Structured data (schema.org) on public pages: Hospital (name, address, phone, open 24/7, 12 departments), Physician (each doctor), MedicalClinic (each department), Article (each news post), FAQPage, BreadcrumbList. This is what Google, Bing and AI assistants read to answer "hospital in Kisumu" questions.
- `/robots.txt` lets search engines and AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended and others) read public pages and keeps portals, sign-in and payment pages out. Those pages also carry a noindex tag.
- `/sitemap.xml` lists every public page, department, doctor and news article, refreshed hourly.
- `/llms.txt` and `/llms-full.txt` are plain-text summaries written for AI assistants.
- The domain you do not choose as main is redirected (308) to the main one, page by page, so Google sees one site.
- Fixed: `/doctors`, `/news`, `/faq`, `/robots.txt`, `/sitemap.xml` and `/llms.txt` were behind the sign-in, so crawlers were being sent to the login page. They are public now.

## You do by hand
1. **Main domain.** Default is `https://lisahospitals.co.ke`. To make `.com` the main one, set `NEXT_PUBLIC_SITE_URL=https://lisahospitals.com` in Vercel (Settings, Environment Variables) and redeploy. Never both.
2. **Vercel domains.** Add all four to the project: `lisahospitals.co.ke`, `www.lisahospitals.co.ke`, `lisahospitals.com`, `www.lisahospitals.com`, and follow the DNS records Vercel shows.
3. **Backend (Render).** Set `FRONTEND_URL` to the main address first, then the other, comma separated (for example `https://lisahospitals.co.ke,https://lisahospitals.com`). The first one is where Paystack sends people back after paying.
4. **Clerk.** Add the main domain (and the other) to the allowed origins and redirect URLs. Clerk production instances need their own domain setup.
5. **Google Search Console.** Add the main domain as a property, copy the verification code, put it in Vercel as `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, redeploy, verify, then submit `https://<main domain>/sitemap.xml`.
6. **Bing Webmaster Tools** (also feeds ChatGPT search and Copilot). Same idea with `NEXT_PUBLIC_BING_SITE_VERIFICATION`. You can import the site from Search Console.
7. **Google Business Profile.** Claim "Lisa Hospitals" in Kisumu with exactly the same name, address and phone as on the site (0784 388 734, Namba Okana along Nairobi Highway). This matters more for "hospital near me" than anything on the website.
8. **Keep facts in one place.** Name, address, phone, hours and insurers live in `lib/hospital.ts`. The pages, structured data, FAQ and `llms.txt` all follow it. Change it there and nowhere else.
9. **Later, when they exist:** add the hospital's Facebook, Instagram or X pages as `sameAs` in `lib/seo.ts`, and a real photo of the building as the share picture.
