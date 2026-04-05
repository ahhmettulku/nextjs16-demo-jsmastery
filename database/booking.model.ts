import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Simple RFC-5322-compatible email pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "eventId is required"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => EMAIL_REGEX.test(v),
        message: "Invalid email address",
      },
    },
  },
  { timestamps: true },
);

// Prevents the same email from booking the same event more than once.
// Also serves as a fast lookup index for (eventId, email) pair queries.
BookingSchema.index({ eventId: 1, email: 1 }, { unique: true });

// Supports efficient listing of bookings per event sorted by booking date (newest first).
BookingSchema.index({ eventId: 1, createdAt: -1 });

/**
 * Before persisting, confirm the referenced Event exists.
 * Prevents orphaned bookings for events that have been deleted or never existed.
 */
// In Mongoose 9 the pre-save hook receives SaveOptions, not a next callback.
// Throw to signal an error; return normally to proceed.
BookingSchema.pre("save", async function () {
  if (this.isNew || this.isModified("eventId")) {
    const EventModel = mongoose.model("Event");
    const exists = await EventModel.exists({ _id: this.eventId });
    if (!exists) {
      throw new Error(`Event with id "${this.eventId}" does not exist`);
    }
  }
});

const Booking: Model<IBooking> =
  mongoose.models.Booking ?? mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
