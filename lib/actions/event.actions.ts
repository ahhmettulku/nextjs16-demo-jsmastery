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

export const submitEmail = async (email: string, eventId: string) => {
  try {
    await connectToDatabase();
    const booking = await Booking.create({ email, eventId: eventId });
    return booking;
  } catch (error) {
    throw new Error(
      "Failed to submit email: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
};
