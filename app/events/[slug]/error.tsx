"use client";

import { useEffect } from "react";

export default function EventError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section id="event">
      <div className="header">
        <h1>Something went wrong</h1>
        <p>{error.message}</p>
        <button onClick={() => unstable_retry()}>Try again</button>
      </div>
    </section>
  );
}
