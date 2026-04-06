# Next.js 16 Demo - Caching & Server Components

This repository is a learning/demo project focused on **new Next.js 16 App Router capabilities**, especially:

- **Cache Components** with `"use cache"`
- **Cache policies** with `cacheLife(...)`
- **Tag-based invalidation** with `cacheTag(...)` + `revalidateTag(...)`
- **Server-side logic** using Server Components and server functions (`"use server"`)

## Main Purpose

The app demonstrates an event platform where data is fetched and rendered with Next.js 16 caching primitives, then revalidated after mutations.

- Event list page caches content with a tag (`events`)
- Event details page caches per-event content (`event-${slug}`)
- API mutations trigger on-demand cache revalidation

## Basic Functionalities

- **Browse events (homepage):** `app/page.tsx` renders featured events from `GET /api/events` and caches the page with `"use cache"`, `cacheLife("hours")`, and `cacheTag("events")`.
- **View event details:** `app/events/[slug]/page.tsx` fetches a single event from `GET /api/events/[slug]`, caches with `cacheLife("days")`, and tags each page as `event-${slug}`.
- **Book an event:** `components/BookEvent.tsx` (Client Component) submits email bookings through `lib/actions/booking.actions.ts` (`"use server"`).
- **See related events:** the event details page loads similar events via `lib/actions/event.actions.ts`.
- **Create/update events through API:**
  - `POST /api/events` creates events and revalidates the `events` tag.
  - `PUT /api/events/[slug]` updates an event and revalidates the `event-${slug}` tag.
- **Handle errors and not-found states:** dedicated route-level error boundaries and `not-found` files are included under `app/`.

## Project Structure

```text
.
|- app/
|  |- api/events/                # Route Handlers for event endpoints
|  |- events/[slug]/             # Dynamic event details route (page, error, not-found)
|  |- layout.tsx                 # Root layout
|  |- page.tsx                   # Homepage (featured events)
|  |- error.tsx                  # Global route error boundary
|- components/                   # Reusable UI components (EventCard, BookEvent, Navbar, etc.)
|- database/                     # Mongoose models and exported types (Event, Booking)
|- lib/
|  |- actions/                   # Server actions (booking/event helpers)
|  |- mongodb.ts                 # Database connection helper
|  |- constants.ts, utils.ts     # Shared utilities/constants
|- public/                       # Static assets (icons, event images)
|- next.config.ts                # Next.js config (`cacheComponents: true`)
|- README.md
```

This repository follows a simple separation:

- **`app/`** for routing and server-rendered pages
- **`components/`** for UI building blocks
- **`lib/` + `database/`** for backend/data logic used by pages and route handlers

## Tech Stack

- Next.js 16 (canary)
- React 19
- TypeScript
- MongoDB + Mongoose
- Tailwind CSS

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Useful Scripts

```bash
npm run dev    # start dev server
npm run build  # production build
npm run start  # run production server
npm run lint   # lint project
```

## Notes

- `cacheComponents` is enabled in `next.config.ts`.
- This project is optimized as a practical reference for writing about **Next.js 16 Caching and Server Components**.
