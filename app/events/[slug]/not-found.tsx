import Link from "next/link";

export default function EventNotFound() {
  return (
    <section id="event">
      <div className="header">
        <h1>Event Not Found</h1>
        <p>The event you are looking for does not exist or has been removed.</p>
        <Link href="/">Back to all events</Link>
      </div>
    </section>
  );
}
