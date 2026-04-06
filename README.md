# Next.js 16 Demo — Caching & Server Components

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
