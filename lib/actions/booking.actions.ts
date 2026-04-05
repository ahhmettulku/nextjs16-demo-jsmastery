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
