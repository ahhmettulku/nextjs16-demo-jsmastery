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
