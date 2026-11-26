"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { apiUrl } from "@/app/lib/auth-client";

type ContactDraft = {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  whatsapp: string;
  message: string;
  consent: boolean;
};

const EMPTY_DRAFT: ContactDraft = {
  firstName: "",
  lastName: "",
  email: "",
  city: "",
  whatsapp: "",
  message: "",
  consent: false,
};

export default function ContactEnquiryForm() {
  const [draft, setDraft] = useState<ContactDraft>(EMPTY_DRAFT);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (status === "success") successHeadingRef.current?.focus();
  }, [status]);

  function updateDraft(field: keyof ContactDraft, value: string | boolean) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setError("");

    try {
      const response = await fetch(`${apiUrl}/enquiries/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: draft.firstName.trim(),
          lastName: draft.lastName.trim(),
          email: draft.email.trim(),
          city: draft.city.trim() || undefined,
          whatsapp: draft.whatsapp.trim() || undefined,
          message: draft.message.trim(),
          consent: draft.consent,
        }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
      if (!response.ok) {
        const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
        throw new Error(message || "We could not send your enquiry. Please try again.");
      }
      setStatus("success");
    } catch (requestError) {
      setStatus("error");
      setError(requestError instanceof Error ? requestError.message : "We could not send your enquiry. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="contact-form-success" role="status" aria-live="polite">
        <p className="home-section-label">ENQUIRY RECEIVED</p>
        <h3 ref={successHeadingRef} tabIndex={-1}>Thank you for reaching out.</h3>
        <p>Deepti’s practice has your message. The team will review it and reply using the contact details you shared.</p>
        <button className="contact-edit-link" type="button" onClick={() => setStatus("idle")}>
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-field-grid">
        <label htmlFor="contact-first-name"><span>First name <span className="contact-required" aria-hidden="true">*</span></span><input id="contact-first-name" name="firstName" type="text" autoComplete="given-name" placeholder="First name" value={draft.firstName} onChange={(event) => updateDraft("firstName", event.target.value)} required /></label>
        <label htmlFor="contact-last-name"><span>Last name <span className="contact-required" aria-hidden="true">*</span></span><input id="contact-last-name" name="lastName" type="text" autoComplete="family-name" placeholder="Last name" value={draft.lastName} onChange={(event) => updateDraft("lastName", event.target.value)} required /></label>
      </div>
      <label htmlFor="contact-email"><span>Email <span className="contact-required" aria-hidden="true">*</span></span><input id="contact-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} required /></label>
      <label htmlFor="contact-city"><span>Town / City</span><input id="contact-city" name="city" type="text" autoComplete="address-level2" placeholder="Your town or city" value={draft.city} onChange={(event) => updateDraft("city", event.target.value)} /></label>
      <label htmlFor="contact-whatsapp"><span>WhatsApp number</span><input id="contact-whatsapp" name="whatsapp" type="tel" autoComplete="tel" inputMode="tel" placeholder="Include your country code" value={draft.whatsapp} onChange={(event) => updateDraft("whatsapp", event.target.value)} /></label>
      <label htmlFor="contact-message"><span>How can we help? <span className="contact-required" aria-hidden="true">*</span></span><textarea id="contact-message" name="message" rows={5} minLength={10} placeholder="Tell us a little about what brings you here." value={draft.message} onChange={(event) => updateDraft("message", event.target.value)} required /></label>
      <label className="contact-consent"><input name="consent" type="checkbox" checked={draft.consent} onChange={(event) => updateDraft("consent", event.target.checked)} required /><span>I understand this is an enquiry. Any consultation, programme or fee will be discussed separately. <span className="contact-required" aria-hidden="true">*</span></span></label>
      {status === "error" ? <p className="contact-form-error" role="alert">{error}</p> : null}
      <button className="home-button home-button-primary contact-submit" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Sending securely…" : "Send enquiry"} <span aria-hidden="true">↗</span></button>
      <p className="contact-form-meta">Your message is sent securely to Deepti’s practice and used only to respond to your enquiry.</p>
    </form>
  );
}
