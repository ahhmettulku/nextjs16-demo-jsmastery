"use client";

import { useState } from "react";

const BookEvent = () => {
  const [email, setEmail] = useState("");
  const [submitted, setsubmitted] = useState(false);

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    // Here you can handle the form submission, e.g., send the email to your server
    setsubmitted(true);
    console.log("Email submitted:", email);
  };

  return (
    <div id="book-event">
      {submitted ? (
        <p className="text-sm">Thank you for signing up</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="email"
              placeholder="Enter your email"
            />
          </div>
          <button type="submit" className="button-submit">
            Submit
          </button>
        </form>
      )}
    </div>
  );
};

export default BookEvent;
