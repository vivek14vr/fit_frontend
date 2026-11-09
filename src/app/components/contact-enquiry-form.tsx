"use client";

import { useState, type FormEvent } from "react";

type BookingRegion = "india" | "international";

const BOOKING_LINKS: Record<BookingRegion, string> = {
  india: "https://cal.com/deeptisherawat/1-on-1-health-consultation",
  international: "https://cal.com/deeptisherawat/1-on-1-health-consultation-international",
};

export default function ContactEnquiryForm() {
  const [region, setRegion] = useState<BookingRegion>("international");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="contact-form-success" id="contact-calendar-options" role="status" aria-live="polite">
        <p className="home-section-label">NEXT STEP</p>
        <h3>Your conversation can begin here.</h3>
        <p>
          Thanks for sharing the context. Choose a time that works for you using the booking calendar below.
        </p>
        <a className="home-button home-button-primary contact-calendar-link" href={BOOKING_LINKS[region]} target="_blank" rel="noopener noreferrer">
          Choose a time with Deepti <span aria-hidden="true">↗</span>
        </a>
        <p className="contact-form-meta">This static form does not store submissions. Please keep a note of the details you shared if you need to refer back to them.</p>
        <button className="contact-edit-link" type="button" onClick={() => setSubmitted(false)}>
          Edit my details
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-field-grid">
        <label><span>First name</span><input name="firstName" type="text" autoComplete="given-name" placeholder="First name" required /></label>
        <label><span>Last name</span><input name="lastName" type="text" autoComplete="family-name" placeholder="Last name" required /></label>
      </div>
      <label><span>Email</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <label><span>Town / City</span><input name="city" type="text" autoComplete="address-level2" placeholder="Your town or city" /></label>
      <label>
        <span>Where are you booking from?</span>
        <select name="bookingRegion" value={region} onChange={event => setRegion(event.target.value as BookingRegion)}>
          <option value="international">US / International</option>
          <option value="india">India</option>
        </select>
        <small>Your booking calendar will match this selection.</small>
      </label>
      <label><span>WhatsApp number</span><div className="contact-phone-field"><select name="countryCode" defaultValue="+1" aria-label="Country code"><option value="+1">USA (+1)</option><option value="+91">India (+91)</option><option value="+44">UK (+44)</option><option value="+61">Australia (+61)</option><option value="+1-CA">Canada (+1)</option></select><input name="whatsapp" type="tel" autoComplete="tel" placeholder="Your number" /></div><small>Deepti’s team will contact you on this number if needed.</small></label>
      <label><span>What would you like help with?</span><textarea name="message" rows={5} placeholder="Tell us a little about what brings you here." required /></label>
      <label className="contact-consent"><input name="consent" type="checkbox" required /><span>I understand this is an enquiry. Any consultation, programme or fee will be discussed separately.</span></label>
      <button className="home-button home-button-primary contact-submit" type="submit">Continue to booking <span aria-hidden="true">↗</span></button>
      <p className="contact-form-meta">This static page does not send or store the form data yet. The booking link appears after you submit the form.</p>
    </form>
  );
}
