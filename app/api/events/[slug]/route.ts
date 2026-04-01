import { Event } from "@/database";
import { connectToDatabase } from "@/lib/mongodb";
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
