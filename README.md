# Lisa Hospitals: Website and staff portal (web)

The public website, online booking, patient area and staff/admin portal for **Lisa Hospitals, Kisumu**. Built with **Next.js 16 (App Router)**, **Clerk**, **Tailwind CSS 4** and deployed on **Vercel**.

> **Mode: booking-only.** The hospital runs its own clinical system, so clinical screens (patients, triage, billing, lab, pharmacy and so on) are hidden. Set `NEXT_PUBLIC_CLINICAL_ENABLED=true` (and `CLINICAL_ENABLED=true` on the API) to bring them back.

Companion repo: `lisa-hospitals-backend` (Express API). See its README for the database, SMS and deployment of the API.

> **Next.js note for contributors:** this is a recent Next.js with breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before changing framework-level code (`AGENTS.md`).

---

## Contents
1. [What is in it](#1-what-is-in-it)
2. [Tech stack](#2-tech-stack)
3. [Project layout](#3-project-layout)
4. [Quick start](#4-quick-start-local)
5. [Environment variables](#5-environment-variables)
6. [Deploying to Vercel](#6-deploying-to-vercel)
7. [Public site](#7-public-site)
8. [Booking pages](#8-booking-pages)
9. [Staff and admin portal](#9-staff-and-admin-portal)
10. [Patient area](#10-patient-area)
11. [Chat](#11-chat)
12. [Theming, dark mode and design](#12-theming-dark-mode-and-design)
13. [Languages](#13-languages)
14. [SEO and discoverability](#14-seo-and-discoverability)
15. [Conventions](#15-conventions)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. What is in it
| Area | Who | Where |
|---|---|---|
| Public website: home, services, doctors, news, about, FAQ, contact, privacy | Everyone | `/` and friends |
| **Online booking, no account** | Everyone | `/book`, manage a booking at `/booking/manage` |
| "Talk to Lisa" helper (signed out) | Visitors | Floating button on public pages |
| Visit log and chat with Lisa | Signed-in patients | `/patient/visits`, `/patient/messages` |
| Booking desk, calendar, Lisa chat inbox | Reception, doctors | `/staff/bookings`, `/staff/calendar`, `/staff/messages` |
| Services, closed days, booking rules, reports, users, news, enquiries, audit | Admin | `/admin/...` |

## 2. Tech stack
Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Clerk (auth) · Axios · Socket.IO client · lucide-react icons · Outfit (portal) and DM Serif Display + Inter (public site) fonts.

## 3. Project layout
```
app/
  (public)/            Website + /book, /booking/manage, /privacy
  (auth)/              Login / register
  (patient)/patient/   visits, messages (+ clinical pages when enabled)
  (staff)/staff/       bookings (+ print), calendar, messages (+ clinical pages)
  (admin)/admin/       dashboard, users, services, booking settings, news, enquiries, audit
  auth/callback        Sends each role to the right home after sign-in
  globals.css          Design tokens, portal theme, dark mode, print rules
  layout.tsx           Fonts and providers
components/
  PortalShell.tsx      Sidebar + header for every portal page, theme toggle, unread badge, sign out
  BookingFlow.tsx      Public booking wizard (EN/SW, OTP, waiting list)
  ManageBooking.tsx    Cancel / reschedule for guests
  BookingDeskParts.tsx Reception desk pieces (to-do, sheets, call history, waiting list)
  SlotPicker.tsx, chat.tsx, LisaWidget.tsx, ui.tsx, Icon.tsx, ...
lib/
  api.ts               Axios client and every API call (bookingApi, chatApi, ...)
  socket.ts            One shared Socket.IO connection per tab
  bot.ts               Rule-based "Lisa" helper for visitors
  i18n.ts              English and Kiswahili text
  hospital.ts          Phone, address, hours, insurers (edit here, the whole site follows)
  features.ts          CLINICAL flag
  quickReplies.ts      Reception's ready-made chat replies
proxy.ts               Clerk middleware: which routes are public
```

## 4. Quick start (local)
```bash
npm install
# create .env.local from section 5
npm run dev            # http://localhost:3000
npm run build          # production build
npm run lint
```
The API must be running (default `http://localhost:8080`). Clerk keys are required to sign in. The public site and `/book` work without signing in.

## 5. Environment variables
| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | URL of the API (used for REST **and** the chat socket), e.g. `https://lisa-api.onrender.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | yes | Clerk |
| `CLERK_SECRET_KEY` | yes | Clerk (server side) |
| `NEXT_PUBLIC_SITE_URL` | recommended | Canonical site URL for SEO, sitemap and share cards, e.g. `https://www.lisahospitals.co.ke` |
| `NEXT_PUBLIC_CLINICAL_ENABLED` | no | Leave unset (booking-only). `true` shows the clinical screens |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION` | optional | Search console verification codes |
Also set Clerk's sign-in/sign-up URLs in the Clerk dashboard to `/login` and `/register`.

## 6. Deploying to Vercel
1. Import the repo. Framework preset: Next.js. No special build settings.
2. Add the variables from section 5. `NEXT_PUBLIC_*` values are baked in at build time, so **redeploy after changing them**.
3. In the API's `FRONTEND_URL` add this site's origin (and any custom domain) so CORS and the chat socket accept it.
4. In Clerk add the production domain.
5. Custom domain: update `NEXT_PUBLIC_SITE_URL`, `FRONTEND_URL`, `BOOKING_PUBLIC_URL` (API) and the Clerk domain together.

## 7. Public site
Content that changes rarely lives in one place: contact details, hours and insurers in `lib/hospital.ts`; departments in `lib/departments.ts`; FAQ answers in `lib/faqs.ts`. Doctors, services and news come from the API. News and doctor photos are managed in the admin area.

## 8. Booking pages
- **`/book`** guides the visitor: department → service (if the department has them) → doctor or first available → date (calendar shows free days) → time → details → SMS code. A honeypot field blocks simple bots. If the day is full, the visitor can join the **waiting list**. Hospital closed days are marked in the calendar.
- **`/booking/manage`** (not indexed by search engines) opens with the private link from the SMS, or reference + phone. The visitor can cancel or move the booking; the cut-off and the number of moves are set by the hospital.
- Works in English and Kiswahili (toggle in the corner). Without SMS configured on the API, bookings are accepted as **pending** and reception phones.

## 9. Staff and admin portal
One shell (`PortalShell`) for all roles: left sidebar (grouped menu with icons, collapses to a drawer on phones), header with date, **dark mode toggle**, public-site link and **Sign out** (also at the bottom of the sidebar). The tab title shows the unread chat count.

**Reception / secretary** (`/staff/bookings`)
- **To-do panel:** calls to make now (doctor change, doctor away, unverified phone, repeat no-show), tomorrow's confirmation calls, today's second calls, bookings awaiting an outcome.
- Tap-to-call numbers (with Copy for PCs), call outcome log and history, **Check in**, mark **No-show** (sends the "we missed you" text), **Move** (slot picker, including walk-in held slots), **Cancel**, **Create** for walk-ins and callers, **Print day list**, waiting list panel.
- **Lisa chat** (`/staff/messages`): shared inbox, live updates, "New chat", quick replies (⚡), attachments, typing and seen indicators.

**Doctor** (`/staff/calendar`)
- Weekly hours for all 7 days, appointment length, optional walk-in hold, click any day to block a whole day or some hours, leave periods. Existing bookings inside a block are flagged red for reception.
- On a booking: "I can't keep this one" with an internal reason and a suggested alternative. Doctors see names and times only.

**Admin** (`/admin/...`)
- **Booking settings:** notice period, horizon, cancel cut-off, bookings per phone, time off, closed days, attendance report, CSV export.
- **Services:** visit types with length, Kiswahili name and doctors.
- **Users:** roles, staff and doctor profiles, weekly schedule.
- News, enquiries from the contact form, audit log.

## 10. Patient area
After sign-in a patient lands on **My visits**: upcoming bookings and full history (Confirmed, Awaiting confirmation, Attended, Missed, Cancelled), matched on the phone number or email of their account. **Messages** is their chat with Lisa. **Book a visit** links to `/book`.

## 11. Chat
- **Signed out:** the floating **Talk to Lisa** button opens a small helper (`lib/bot.ts`). It answers hours, location, phone, departments, insurance, booking and cancelling from published facts, sends emergencies to the phone number, and hands anything personal or clinical to sign-in. It is rule-based, runs in the browser and stores nothing. After a few messages it asks the visitor to sign in.
- **Signed in:** patients chat with "Lisa". The front desk replies from the shared inbox. Messages, typing, seen receipts, online status and unread badges are **live** over Socket.IO (`lib/socket.ts`: one connection per tab, fresh Clerk token on every reconnect). If the socket drops, pages poll every few seconds and catch up on reconnect.
- Patients see only "Lisa". Staff see who replied (name and role). Photos and PDFs up to 8 MB are uploaded straight to Cloudinary as private files.

## 12. Theming, dark mode and design
- The portal uses a TailAdmin-style layout (white sidebar, 72px header, rounded cards) scoped to the `.portal` class so the public site keeps its own look.
- All colours are CSS variables (`--navy`, `--teal`, `--grey-*`, `--surface`, `--page`). **Dark mode** is the `.portal.dark` class, which only swaps the variables. The choice is remembered in the browser (`localStorage` key `lh-theme`).
- Use the tokens (`var(--surface)` rather than white, `var(--navy)` for text) in new components so dark mode works automatically.
- Brand: teal `#00969A`, navy `#0B2545`.
- Printing: the sidebar and header carry `no-print`; the day list and receipts print as plain pages.

## 13. Languages
English and Kiswahili for the public booking pages (`lib/i18n.ts`, `useLang`). The choice is remembered per browser. The portal is in English.

## 14. SEO and discoverability
Metadata and structured data for the hospital, doctors and FAQ, `sitemap.xml`, `robots.txt`, `llms.txt`/`llms-full.txt` for AI assistants and social share images are generated from the same data as the pages. Portal and manage pages are `noindex`. See `SEO-SETUP.md` for Search Console and Bing steps.

## 15. Conventions
- Keep API calls in `lib/api.ts`. Keep hospital facts in `lib/hospital.ts`.
- Pages that read the URL with `useSearchParams` need a `<Suspense>` boundary.
- ESLint's React rules apply: no state updates directly in effects (derive state, or defer with a timer or callback).
- Wrap `localStorage` in try/catch (private windows throw).
- New staff screens: wrap in `PortalShell`, add the link to its nav list, add it to the booking-only list if it should show without the clinical modules.
- Run `npx tsc --noEmit`, `npm run lint` and `npm run build` before pushing.

## 16. Troubleshooting
| Symptom | Likely cause |
|---|---|
| `/book` says "Something went wrong" | The API database is missing the booking tables (run `4-booking-schema.sql` there), or `NEXT_PUBLIC_API_URL` is wrong |
| Chat is stuck on "Reconnecting…" | The site's origin isn't in the API's `FRONTEND_URL`, or the API is asleep (Render free plan) |
| Signed in but sent back to login | Clerk keys or domain mismatch between Vercel and Clerk |
| A staff menu item is missing | Role not allowed for that item, or the item isn't in the booking-only list |
| Changed an env var but nothing changed | `NEXT_PUBLIC_*` need a redeploy |
| Dark mode looks off on a screen | A hard-coded colour; switch it to a token |

Status: built and checked with type-checking, lint and production builds. A full pass on the live Vercel/Render/Neon/Clerk setup is the first thing to do after deploying.
