<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Thespace Viewer - Project Documentation

> [!IMPORTANT]
> **AI AGENT DIRECTIVE:** This file serves as the core memory and context for this project. Whenever you implement a new feature, modify the architecture, or add new capabilities to the frontend or backend, you MUST append or update the relevant sections in this file to reflect the changes. This ensures continuity across different coding sessions.

NEVER COMMIT OR PUSH CHANGES IF NOT EXPLICITLY REQUESTED

## 1. Overview
A custom dashboard and viewer for "The Space Cinema" (Cerro Maggiore - ID 1016), built with Next.js 15, React, and Tailwind CSS. It proxies undocumented microservices to present a clean, fast, and feature-rich UI.

## 2. Backend / API Proxy (`src/app/api/schedule/route.ts`)
*   **The Problem:** The official API blocks requests without a valid session cookie, and Cloudflare blocks bot traffic.
*   **The Proxy Solution (ZenRows with js_instructions):** 
    *   The Next.js route uses **ZenRows** to bypass Cloudflare. Previously it required two steps (fetching the home page for cookies, then fetching the JSON API), but this failed when Cloudflare increased security on the API endpoint.
    *   Now, we use a single ZenRows request utilizing `js_render=true`, `premium_proxy=true`, and `js_instructions`.
    *   This tells ZenRows to navigate to the homepage (bypassing the Cloudflare challenge natively in a headless browser), run a `fetch()` command from *within* the authenticated browser context to get the JSON schedule, and inject it back into the DOM (`<div id="api-data">...</div>`). We then extract it from the HTML response.
    *   This guarantees that the API request perfectly mirrors a real user's session and completely sidesteps 422 errors associated with proxying pure JSON endpoints directly.
*   **Date Optimization:** By explicitly removing the `showingDate` parameter from the query string, the API returns the complete schedule for the next ~15 days for all movies in a single ~270KB payload. This allows for instant client-side date switching.
*   **Caching Strategy:** To prevent rate-limiting and minimize ZenRows usage, the API uses a dual-layer 1-hour cache in production (in-memory variable + `Cache-Control: s-maxage=3600`). When running locally (`NODE_ENV === 'development'`), the Next.js `Response` cache is bypassed (`no-store`) for live testing.
*   **Cache Warming (Vercel Cron):** A Vercel Cron job (`vercel.json`) is configured to hit the `/api/schedule` endpoint every hour (`0 * * * *`). This keeps the Edge Cache and in-memory cache populated.

## 3. Frontend Architecture (`src/components/CinemaDashboard.tsx` & sub-components)
*   **Componentization:** The UI is split into modular components (`MovieGrid`, `MovieTimeline`, `MovieCatalog`, `MovieDetail`, `DashboardHeader`, `SeatMapModal`) located in `src/components/`.
*   **Data Fetching:** Uses `swr` for data fetching (`useSWR('/api/schedule')`), providing built-in caching, request deduplication, and background revalidation.
*   **State & Routing:**
    *   Uses native browser History API (`pushState` / `popstate`) combined with URL hash routing (e.g., `#HO00003471`).
    *   Navigating back and forth using physical browser buttons works flawlessly, seamlessly restoring the dashboard state without reloading.
*   **Date Navigation:**
    *   Dynamically extracts available dates directly from the API payload (no hardcoded limits).
    *   Horizontal scrollable sticky date picker with smooth-scrolling arrow buttons.
*   **Views:**
    1.  **Vista per Film (Grid):** Groups showings by movie, displaying all sessions for the selected day.
    2.  **Vista Oraria (Timeline):** A vertical chronological timeline of all showings for the selected day, sorted by start time.
    3.  **Catalogo Completo:** A grid of movie posters displaying all available movies. Includes the "Dal [data]" (First available date) directly on the movie card.
*   **Movie Detail Screen (Full Schedule):**
    *   Clicking a movie title or poster navigates to a dedicated screen showing its schedule across all upcoming days simultaneously.

## 4. UI/UX Details & Styling
*   **Disabled Sessions:** Sessions that are sold out are grayed out using `session.isSoldOut`.
*   **External Booking:** Clicking an active time slot opens the official ticket booking page (`bookingUrl`) in a new tab.
*   **Time Display:** Shows both start time and end time (if available).
*   **Image Optimization:** Uses Next.js `<Image>` component for posters to ensure automatic optimization and lazy loading.
*   **Favorites / Watchlist:** Users can star movies. Favorites are persisted in `localStorage` and automatically sorted to the top of the lists.
*   **Seating Maps (Salas):**
    *   Clicking on a "Sala X" badge opens a modal displaying the exact seat map for that room.
    *   Images are stored in `/public/seats/sala_x.png`.
    *   A cache buster (`?v=3`) is appended to the image source to ensure browsers don't load stale images.
    *   Integrates `react-zoom-pan-pinch` to allow interactive zooming and panning of the seat maps.

## 5. Automation Tools (Puppeteer)
*   The `public/seats/` images were automatically generated using a Puppeteer script (`scrape-seats-all.js`).
*   **How it works:** Uses `puppeteer-extra-plugin-stealth` to bypass Cloudflare. It reads the API data, finds the session for each Sala that is scheduled *furthest in the future* (to ensure no seats are booked), injects CSS to force any potentially greyed-out occupied seats to look like normal available seats, and captures a carefully cropped screenshot of the SVG seating map.
