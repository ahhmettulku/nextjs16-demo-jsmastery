import { Event } from "@/database";
import { connectToDatabase } from "@/lib/mongodb";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return new NextResponse(JSON.stringify({ error: "Invalid slug" }), {
        status: 400,
      });
    }

    const sanitizedSlug = slug.trim().toLowerCase();

    await connectToDatabase();
    const event = await Event.findOne({ slug: sanitizedSlug }).lean();
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching event by slug:", error);
    }
    if (error instanceof Error) {
      if (error.message.includes("MONGODB_URI")) {
        return NextResponse.json(
          { error: "Database connection error" },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { message: "Failed to fetch event" },
        { status: 500 },
      );
    }
    // Handle unknown errors
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

const UPDATABLE_FIELDS = [
  "title",
  "description",
  "overview",
  "image",
  "venue",
  "location",
  "date",
  "time",
  "mode",
  "audience",
  "agenda",
  "organizer",
  "tags",
] as const;

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
    if (process.env.NODE_ENV === "development") {
      console.error("Error updating event by slug:", error);
    }
    if (error instanceof Error) {
      if (error.message.includes("MONGODB_URI")) {
        return NextResponse.json(
          { error: "Database connection error" },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { message: "Failed to update event" },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
