import mongoose, { Document, Model, Schema } from "mongoose";

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },

    // Unique URL-friendly identifier; auto-generated from title in pre-save hook
    slug: { type: String, unique: true, trim: true },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    overview: {
      type: String,
      required: [true, "Overview is required"],
      trim: true,
    },
    image: { type: String, required: [true, "Image is required"], trim: true },
    venue: { type: String, required: [true, "Venue is required"], trim: true },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },

    // Stored as ISO date string (YYYY-MM-DD) after normalization in pre-save hook
    date: { type: String, required: [true, "Date is required"] },

    // Stored in 24-hour HH:MM format after normalization in pre-save hook
    time: { type: String, required: [true, "Time is required"] },

    mode: {
      type: String,
      required: [true, "Mode is required"],
      enum: {
        values: ["online", "offline", "hybrid"],
        message: "Mode must be online, offline, or hybrid",
      },
    },
    audience: {
      type: String,
      required: [true, "Audience is required"],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, "Agenda is required"],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "Agenda must have at least one item",
      },
    },
    organizer: {
      type: String,
      required: [true, "Organizer is required"],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, "Tags are required"],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "Tags must have at least one item",
      },
    },
  },
  { timestamps: true }
);

/** Converts a title to a URL-friendly slug, e.g. "Hello World!" → "hello-world" */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")   // remove non-word characters
    .replace(/[\s_]+/g, "-")    // replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, "");   // strip leading/trailing hyphens
}

/** Normalizes an input date string to ISO date format YYYY-MM-DD. */
function normalizeDate(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) throw new Error(`Invalid date value: "${raw}"`);
  return d.toISOString().slice(0, 10);
}

/**
 * Normalizes a time string to 24-hour HH:MM format.
 * Accepts "9:05 AM", "21:30", "9:5", etc.
 */
function normalizeTime(raw: string): string {
  const trimmed = raw.trim();

  // Handle 12-hour format with AM/PM
  const ampm = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let hours = parseInt(ampm[1], 10);
    const minutes = ampm[2];
    const meridiem = ampm[3].toUpperCase();
    if (meridiem === "AM" && hours === 12) hours = 0;
    if (meridiem === "PM" && hours !== 12) hours += 12;
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  // Handle 24-hour format (possibly without zero-padding)
  const h24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    return `${String(parseInt(h24[1], 10)).padStart(2, "0")}:${h24[2]}`;
  }

  throw new Error(`Invalid time value: "${raw}"`);
}

// In Mongoose 9 the pre-save hook receives SaveOptions, not a next callback.
// Throw to signal an error; return normally to proceed.
EventSchema.pre("save", function () {
  // Regenerate slug only when title is new or has changed
  if (this.isNew || this.isModified("title")) {
    this.slug = toSlug(this.title);
  }

  // Normalize date and time on every save so stored values stay consistent
  if (this.isModified("date") || this.isNew) {
    this.date = normalizeDate(this.date);
  }
  if (this.isModified("time") || this.isNew) {
    this.time = normalizeTime(this.time);
  }
});

const Event: Model<IEvent> =
  mongoose.models.Event ?? mongoose.model<IEvent>("Event", EventSchema);

export default Event;
