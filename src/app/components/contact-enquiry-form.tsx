"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type BookingRegion = "india" | "international";

const BOOKING_LINKS: Record<BookingRegion, string> = {
  india: "https://cal.com/deeptisherawat/1-on-1-health-consultation",
  international: "https://cal.com/deeptisherawat/1-on-1-health-consultation-international",
};

type ContactDraft = {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  whatsapp: string;
  message: string;
};

const EMPTY_DRAFT: ContactDraft = {
  firstName: "",
  lastName: "",
  email: "",
  city: "",
  whatsapp: "",
  message: "",
};

export default function ContactEnquiryForm() {
  const [region, setRegion] = useState<BookingRegion>("international");
  const [countryCode, setCountryCode] = useState("+1");
  const [draft, setDraft] = useState<ContactDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState(false);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (submitted) successHeadingRef.current?.focus();
  }, [submitted]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setDraft({
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      city: String(formData.get("city") ?? ""),
      whatsapp: String(formData.get("whatsapp") ?? ""),
      message: String(formData.get("message") ?? ""),
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="contact-form-success" id="contact-calendar-options" role="status" aria-live="polite">
        <p className="home-section-label">NEXT STEP</p>
        <h3 ref={successHeadingRef} tabIndex={-1}>Your conversation can begin here.</h3>
        <p>
          Your form is complete on this page. Choose a time that works for you using the booking calendar below.
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
        <label htmlFor="contact-first-name"><span>First name <span className="contact-required" aria-hidden="true">*</span></span><input id="contact-first-name" name="firstName" type="text" autoComplete="given-name" placeholder="First name" defaultValue={draft.firstName} required /></label>
        <label htmlFor="contact-last-name"><span>Last name <span className="contact-required" aria-hidden="true">*</span></span><input id="contact-last-name" name="lastName" type="text" autoComplete="family-name" placeholder="Last name" defaultValue={draft.lastName} required /></label>
      </div>
      <label htmlFor="contact-email"><span>Email <span className="contact-required" aria-hidden="true">*</span></span><input id="contact-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" defaultValue={draft.email} required /></label>
      <label htmlFor="contact-city"><span>Town / City</span><input id="contact-city" name="city" type="text" autoComplete="address-level2" placeholder="Your town or city" defaultValue={draft.city} /></label>
      <label htmlFor="contact-booking-region">
        <span>Where are you booking from? <span className="contact-required" aria-hidden="true">*</span></span>
        <select id="contact-booking-region" name="bookingRegion" value={region} aria-describedby="contact-booking-region-help" onChange={event => {
          const nextRegion = event.target.value as BookingRegion;
          setRegion(nextRegion);
          if (nextRegion === "india") setCountryCode("+91");
        }}>
          <option value="international">US / International</option>
          <option value="india">India</option>
        </select>
        <small id="contact-booking-region-help">Your booking calendar will match this selection.</small>
      </label>
      <label htmlFor="contact-whatsapp"><span>WhatsApp number</span><div className="contact-phone-field"><select name="countryCode" value={countryCode} aria-label="Country code" onChange={event => setCountryCode(event.target.value)}><option value="+1">USA (+1)</option><option value="+91">India (+91)</option><option value="+44">UK (+44)</option><option value="+61">Australia (+61)</option><option value="+1-CA">Canada (+1)</option></select><input id="contact-whatsapp" name="whatsapp" type="tel" autoComplete="tel" placeholder="Your number" defaultValue={draft.whatsapp} aria-describedby="contact-whatsapp-help" /></div><small id="contact-whatsapp-help">Deepti’s team will contact you on this number if needed.</small></label>
      <label htmlFor="contact-message"><span>What would you like help with? <span className="contact-required" aria-hidden="true">*</span></span><textarea id="contact-message" name="message" rows={5} placeholder="Tell us a little about what brings you here." defaultValue={draft.message} required /></label>
      <label className="contact-consent"><input name="consent" type="checkbox" required /><span>I understand this is an enquiry. Any consultation, programme or fee will be discussed separately. <span className="contact-required" aria-hidden="true">*</span></span></label>
      <button className="home-button home-button-primary contact-submit" type="submit">Continue to booking <span aria-hidden="true">↗</span></button>
      <p className="contact-form-meta">This static page does not send or store the form data yet. The booking link appears after you submit the form.</p>
    </form>
  );
}
