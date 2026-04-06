# Next.js 16 Feature Usage Review: Server Actions & Caching

This review summarizes where and how this repository uses Next.js 16 features relevant to a blog post about **Server Actions** and **Caching**.

## 1) Server Actions / Server Functions usage

### Where they are implemented

- `lib/actions/booking.actions.ts` and `lib/actions/event.actions.ts` are both marked with the file-level directive `"use server"`.
- This means each exported async function is a server function callable from server components and client components.

### How they are invoked

- `createBooking` is imported into the client component `components/BookEvent.tsx` and called in a submit handler.
- `getSimilarEventsBySlug` is called from the server component `app/events/[slug]/page.tsx`.

### Assessment

- ✅ Correct baseline setup for server functions in Next 16:
  - Server files use `"use server"`.
  - Client component imports and calls a server function.
- ⚠️ The client form currently uses `onSubmit` + local state, rather than `<form action={serverAction}>` or `formAction`.
  - It still works, but it does not demonstrate progressive enhancement and built-in action ergonomics as strongly as idiomatic Server Action form usage.
- ⚠️ Security/auth checks are not present inside server functions.
  - Since server functions are reachable by POST, authz/authn checks should be added in production.

## 2) Caching usage (`use cache`, `cacheLife`, `cacheTag`, `revalidateTag`)

### Cache Components enabled

- `next.config.ts` has `cacheComponents: true`, so the app is using the newer cache model.

### UI-level caching patterns in pages

- `app/page.tsx`:
  - Uses `"use cache"` in the page component.
  - Uses `cacheLife("hours")`.
  - Tags output with `cacheTag("events")`.
  - Fetches from `/api/events`.
- `app/events/[slug]/page.tsx`:
  - Uses `"use cache"`.
  - Uses `cacheLife("days")`.
  - Tags output with `cacheTag(
    \`event-${slug}\`
    )`.
  - Fetches from `/api/events/[slug]`.

### On-demand invalidation usage

- `app/api/events/route.ts`:
  - `POST` creates an event and calls `revalidateTag("events", "max")`.
- `app/api/events/[slug]/route.ts`:
  - `PUT` updates an event and calls `revalidateTag(\`event-${sanitizedSlug}\`, "max")`.

### Assessment

- ✅ Strong demonstration of new cache primitives:
  - cache directives (`"use cache"`),
  - profile-based lifetime (`cacheLife("hours"|"days")`),
  - tag assignment (`cacheTag`),
  - tag revalidation (`revalidateTag(..., "max")`).
- ✅ Uses the recommended two-argument `revalidateTag` form with `"max"`.
- ⚠️ Cache invalidation coverage gap:
  - Updating a specific event revalidates only `event-${slug}`, not the list tag `events`.
  - If an update affects list-visible fields (title/date/image/etc.), homepage list cache may remain stale until TTL or separate revalidation.
- ⚠️ Event creation currently revalidates only `events`.
  - If you ever precompute/tag detail pages, consider whether detail tags should also be invalidated on create/update depending on your flow.

## 3) Blog-post-ready narrative you can use

You can frame this repo as a practical Next.js 16 caching pipeline:

1. **Mark expensive server-rendered UI as cacheable** with `"use cache"`.
2. **Attach policy** with `cacheLife(...)` to control staleness/revalidation windows.
3. **Attach logical tags** (`events`, `event-${slug}`) with `cacheTag(...)`.
4. **Invalidate by domain event** (create/update) with `revalidateTag(..., "max")` from route handlers.

And for Server Actions:

1. **Define server-side mutators** in `"use server"` modules.
2. **Invoke from client UI** to keep write logic on the server.
3. Prefer **form `action`/`formAction` patterns** when teaching Next.js idioms, because they show progressive enhancement and native action flow.

## 4) Suggested improvements (if you want stronger examples)

- Use `form action={createBooking}` (or `formAction` on submit button) to make the booking flow a canonical Server Action demo.
- Add auth checks in server functions (especially mutation paths).
- Revalidate both detail and list tags when event mutations affect list data:
  - e.g., in `PUT /api/events/[slug]`, call both:
    - `revalidateTag(\`event-${slug}\`, "max")`
    - `revalidateTag("events", "max")`
- Optionally include an example of custom `cacheLife` profiles in `next.config.ts` to show advanced Next 16 tuning in the blog post.
