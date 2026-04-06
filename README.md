## Learning Guide: Next.js 16 Caching and Server Actions

This project is designed to help developers, especially junior developers, understand some of the most important changes in **Next.js 16**, with a special focus on **caching** and **Server Actions**.

Instead of only explaining the concepts in theory, this repo shows how they are used in a small real project. You can explore the code and see how page-level caching, tag-based invalidation, and server-side actions work together in practice.

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

## Preview

**Homepage** — featured event list, cached with `cacheTag("events")` and `cacheLife("hours")`:

![Homepage](public/images/homepage.png)

**Event Details** — per-event page, cached with `cacheTag(\`event-${slug}\`)` and `cacheLife("days")`:

![Event Details](public/images/event-details.png)

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

1. Copy `.env.local.example` to `.env.local` (or create `.env.local`) and fill in the required values:

```bash
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

- **`MONGODB_URI`** — connection string for your MongoDB database (local or Atlas).
- **`NEXT_PUBLIC_BASE_URL`** — the base URL the app uses to call its own API routes. Set to `http://localhost:3000` during local development.

2. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 1. Using Cache in Next.js 16

In **Next.js 16**, caching is more explicit and easier to control. Instead of relying only on automatic behavior, developers can now define how server-rendered content should be cached, how long it should stay fresh, and when it should be invalidated.

Here are the main caching primitives used in this repo:

- **`"use cache"`**: marks a server component so its rendered output can be cached.
- **`cacheLife(...)`**: defines how long the cached output should be considered fresh.
- **`cacheTag(...)`**: assigns one or more tags to cached output so it can later be invalidated by tag.
- **`revalidateTag(...)`**: invalidates cached content associated with a tag, usually after a mutation such as create or update.

---

### Example 1 — Homepage Caching

File: `app/page.tsx`

```tsx
import EventCard from "@/components/EventCard";
import ExploreBtn from "@/components/ExploreBtn";
import { IEvent } from "@/database";
import { cacheLife, cacheTag } from "next/cache";

const HomePage = async () => {
  "use cache";
  cacheLife("hours");
  cacheTag("events");
  let response: Response;
  try {
    response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/events`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    throw new Error("Failed to reach the events service. Please try again.");
  }

  if (!response.ok) {
    throw new Error(`Failed to load events (HTTP ${response.status}).`);
  }

  const events: IEvent[] = await response.json();

  return (
    <section>
      <h1 className="text-center">
        The Hub for Every Dev <br />
        Event You Can't Miss
      </h1>
      <p className="text-center mt-5">
        Hackatons, Meetups, and Conferences, All in One Place
      </p>
      <ExploreBtn />
      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>
        <ul className="events list-none">
          {events &&
            events.length > 0 &&
            events.map((event) => (
              <li key={event.title}>
                <EventCard {...event} />
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
};

export default HomePage;
````

This page is cached because it displays the main list of events, which is content that can be reused across requests instead of being regenerated every time.

How caching is used here:

* **`"use cache"`** enables caching for the page output.
* **`cacheLife("hours")`** tells Next.js this cached result can be reused for hours.
* **`cacheTag("events")`** groups this page under the `events` tag so it can be invalidated when event data changes.

---

### On-Demand Invalidation for Homepage Cache

File: `app/api/events/route.ts`

```ts
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    let event;
    try {
      event = Object.fromEntries(formData.entries());
    } catch (error) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }
    const createdEvent = await Event.create(event);
    revalidateTag("events", "max");
    return NextResponse.json(createdEvent, { status: 201 });
  } catch (error) {
    console.error("Error connecting to database:", error);
    return NextResponse.json(
      { error: "Failed to connect to database" },
      { status: 500 },
    );
  }
}
```

This is an example of **on-demand invalidation**.

When a new event is created, the homepage event list may become outdated. Calling:

```ts
revalidateTag("events", "max");
```

tells Next.js to invalidate everything cached under the `events` tag, so the next request gets fresh data.

The second argument `"max"` is the revalidation **scope**. `"max"` means the invalidation propagates to all cache layers — including any CDN or shared edge cache — not just the local server cache. If you omit this argument, only the local in-process cache is cleared.

---

### Example 2 — Dynamic Event Details Page Caching

File: `app/events/[slug]/page.tsx`

```tsx
import BookEvent from "@/components/BookEvent";
import EventCard from "@/components/EventCard";
import { IEvent } from "@/database";
import { getSimilarEventsBySlug } from "@/lib/actions/event.actions";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import { notFound } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const EventDetailsPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  "use cache";
  const { slug } = await params;
  cacheLife("days");
  cacheTag(`event-${slug}`);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/events/${slug}`);
  } catch {
    throw new Error("Failed to reach the events service. Please try again.");
  }

  if (res.status === 404) notFound();

  if (!res.ok) {
    throw new Error(`Failed to load event (HTTP ${res.status}).`);
  }

  const event: IEvent = await res.json();

  const EventDetailItem = ({
    icon,
    alt,
    label,
  }: {
    icon: string;
    alt: string;
    label: string;
  }) => (
    <div className="flex-row-gap-2 items-center">
      <Image src={icon} alt={alt} width={17} height={17} />
      <p>{label}</p>
    </div>
  );

  const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
    <div className="agenda">
      <h2>Agenda</h2>
      <ul>
        {agendaItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );

  const EventTags = ({ tags }: { tags: string[] }) => (
    <div className="flex flex-row gap-1.5 flex-wrap">
      {tags.map((tag) => (
        <div className="pill" key={tag}>
          {tag}
        </div>
      ))}
    </div>
  );

  const similarEvents = await getSimilarEventsBySlug(slug);

  return (
    <section id="event">
      <div className="header">
        <h1>{event.title}</h1>
        <p>{event.description}</p>
      </div>
      <div className="details">
        <div className="content">
          <Image
            src={event.image}
            alt={"event_picture"}
            width={800}
            height={800}
            className="banner"
          />
          <section className="flex-col-gap-2">
            <h2>Overview</h2>
            <p>{event.overview}</p>
          </section>
          <section className="flex-col-gap-2">
            <h2>Event Details</h2>
            <EventDetailItem icon="/icons/calendar.svg" alt="calendar" label={event.date} />
            <EventDetailItem icon="/icons/clock.svg" alt="clock" label={event.time} />
            <EventDetailItem icon="/icons/pin.svg" alt="pin" label={event.venue} />
            <EventDetailItem icon="/icons/mode.svg" alt="mode" label={event.mode} />
            <EventDetailItem icon="/icons/audience.svg" alt="audience" label={event.audience} />
          </section>
          <EventAgenda
            agendaItems={(() => {
              try {
                return JSON.parse(event.agenda[0]);
              } catch {
                return [];
              }
            })()}
          />
          <section className="flex-col-gap-2">
            <h2>About the Organizer</h2>
            <p>{event.organizer}</p>
          </section>
          <section>
            <EventTags
              tags={(() => {
                try {
                  return event.tags;
                } catch {
                  return [];
                }
              })()}
            />
          </section>
        </div>
        <aside className="booking">
          <div className="signup-card">
            <h2>Book Your Spot</h2>
            <BookEvent eventId={event._id.toString()} />
          </div>
        </aside>
      </div>
      <div className="flex w-full flex-col gap-4 pt-20">
        <h2>Similar Events</h2>
        <div className="events">
          {similarEvents.length > 0 &&
            similarEvents.map((similarEvent) => (
              <EventCard {...similarEvent} key={similarEvent._id.toString()} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default EventDetailsPage;
```

This page is cached because each event detail page is a good candidate for reuse. Event details usually do not change on every request, so caching improves performance and reduces unnecessary work.

How caching is used here:

* **`"use cache"`** allows the page output to be cached.
* **`cacheLife("days")`** keeps it reusable for a longer period than the homepage.
* **`cacheTag(\`event-${slug}`)`** creates a separate cache tag for each event page.

This is more granular than the homepage. Instead of invalidating the whole event list, each event page can be invalidated individually.

---

### On-Demand Invalidation for Event Details

File: `app/api/events/[slug]/route.ts`

```ts
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const sanitizedSlug = slug.trim().toLowerCase();

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    await connectToDatabase();
    const event = await Event.findOne({ slug: sanitizedSlug });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    for (const field of UPDATABLE_FIELDS) {
      if (field in body) {
        (event as unknown as Record<string, unknown>)[field] = body[field];
      }
    }

    await event.save();

    revalidateTag(`event-${sanitizedSlug}`, "max");

    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
```

This invalidation is more specific than the homepage invalidation.

When an event is updated, only the cache for that specific event page needs to be refreshed. Calling:

```ts
revalidateTag(`event-${sanitizedSlug}`, "max");
```

invalidates the cache for the updated event detail page without unnecessarily refreshing all other event pages.

As above, `"max"` ensures the invalidation reaches all cache layers, not just the local server cache.

---

## 2. Server Actions Usage

**Server Actions** are functions that run on the server and are marked with the `"use server"` directive.

They are useful because they allow you to keep important logic, such as database operations, on the server while still calling that logic directly from your application code. This helps reduce API boilerplate, improves security by keeping sensitive logic on the server, and makes it easier to organize mutations close to the data layer.

Some advantages of Server Actions:

* they keep database and backend logic on the server
* they reduce the need for extra API routes in many form or mutation use cases
* they make server-side logic easier to reuse
* they work well with both Client Components and Server Components depending on the use case

---

### How and Where Server Actions Are Implemented in This Repo

In this project, Server Actions are implemented under:

```text
lib/actions/
```

They are used in two different ways:

* one action handles a client-triggered booking submission
* another action fetches related data directly from a server-rendered page

---

### Example 1 — `lib/actions/booking.actions.ts`

```ts
"use server";
import { connectToDatabase } from "../mongodb";
import { Booking } from "@/database";

export const createBooking = async ({
  eventId,
  email,
}: {
  eventId: string;
  email: string;
}): Promise<{ ok: boolean; error?: string }> => {
  try {
    await connectToDatabase();
    await Booking.create({ eventId, email });
    return { ok: true };
  } catch (error) {
    console.error("Error creating booking:", error);
    const isDuplicate =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: unknown }).code === 11000;
    return {
      ok: false,
      error: isDuplicate
        ? "This email has already been used to book this event."
        : "Failed to create booking" +
          (error instanceof Error ? `: ${error.message}` : ""),
    };
  }
};
```

This is a Server Action because it starts with:

```ts
"use server";
```

It is responsible for creating a booking record in the database. It also handles duplicate booking errors and returns a small structured response that the UI can use.

---

### How/Where Is This Invoked?

`createBooking` is imported into the client component `components/BookEvent.tsx` and called in a submit handler.

File: `components/BookEvent.tsx`

```tsx
"use client";

import { createBooking } from "@/lib/actions/booking.actions";
import { useState } from "react";

const BookEvent = ({ eventId }: { eventId: string }) => {
  const [email, setEmail] = useState("");
  const [submitted, setsubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const result = await createBooking({ email, eventId });

    if (result.ok) {
      setsubmitted(true);
    } else {
      setError(result.error ?? "Failed to create booking");
    }
  };

  return (
    <div id="book-event">
      {submitted ? (
        <p className="text-sm">Thank you for signing up</p>
      ) : (
        <form action={handleSubmit}>
          <div>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="email"
              placeholder="Enter your email"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <button type="submit" className="button-submit">
            Submit
          </button>
        </form>
      )}
    </div>
  );
};
```

This is a good example of a **Client Component calling a Server Action**. The form interaction happens in the browser, but the actual booking creation happens securely on the server.

Notice two React 19 / Next.js 16 specifics here:

- **`action={handleSubmit}`** — React 19 introduced native support for passing an async function directly to the `action` prop of a `<form>`. This is different from the older `onSubmit` pattern and does not require calling `e.preventDefault()`, because React handles form submission natively.
- **No event argument** — `handleSubmit` takes no parameters. The browser's default form submission behaviour is suppressed automatically by React when `action` receives a function.

---

### Example 2 — `lib/actions/event.actions.ts`

```ts
"use server";

import { Booking, Event } from "@/database";
import { connectToDatabase } from "../mongodb";

export const getSimilarEventsBySlug = async (slug: string) => {
  try {
    await connectToDatabase();
    const event = await Event.findOne({ slug });
    return await Event.find({
      _id: { $ne: event?._id },
      tags: { $in: event?.tags },
    })
      .limit(3)
      .lean();
  } catch (error) {
    console.error(
      "Failed to fetch similar events: " +
        (error instanceof Error ? error.message : String(error)),
    );
    return [];
  }
};
```

This Server Action is used to fetch similar events based on the current event's slug and tags.

It runs on the server, connects to the database, finds the current event, and then returns a limited list of related events.

---

### How/Where Is This Invoked?

`getSimilarEventsBySlug` is called from the server component `app/events/[slug]/page.tsx`.

Small code example from that page:

```tsx
const { slug } = await params;
const similarEvents = await getSimilarEventsBySlug(slug);
```

This is a good example of a **Server Component calling a Server Action**. Since both run on the server, the page can fetch related data directly without moving that logic into the client.

---

## Summary

This repo is intended to teach modern Next.js patterns through practical examples:

* **Caching** with `use cache`, `cacheLife`, `cacheTag`, and `revalidateTag`
* **Granular invalidation** with collection-level and item-level tags
* **Server Actions** for keeping database and mutation logic on the server
* **Client-to-server interaction** through form submission
* **Server-side data loading** directly from server-rendered pages

If you are learning Next.js 16, this project can help you understand not just what these features are, but also how they work together in a real app.