import BookEvent from "@/components/BookEvent";
import { IEvent } from "@/database";
import Image from "next/image";
import { notFound } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const EventDetailsPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

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

  const bookings = 10;

  return (
    <section id="event">
      <div className="header ">
        <h1>Event Description</h1>
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
            <EventDetailItem
              icon="/icons/calendar.svg"
              alt="calendar"
              label={event.date}
            />
            <EventDetailItem
              icon="/icons/clock.svg"
              alt="clock"
              label={event.time}
            />{" "}
            <EventDetailItem
              icon="/icons/pin.svg"
              alt="pin"
              label={event.venue}
            />{" "}
            <EventDetailItem
              icon="/icons/mode.svg"
              alt="mode"
              label={event.mode}
            />{" "}
            <EventDetailItem
              icon="/icons/audience.svg"
              alt="audience"
              label={event.audience}
            />
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
                  return JSON.parse(event.tags[0]);
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
            {bookings > 0 ? (
              <p className="text-sm">
                Join {bookings} people who already booked their spot
              </p>
            ) : (
              <p className="text-sm">Be the first to book your spot</p>
            )}
            <BookEvent />
          </div>
        </aside>
      </div>
    </section>
  );
};

export default EventDetailsPage;
