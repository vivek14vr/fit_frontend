"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { apiUrl } from "@/app/lib/auth-client";
import { useModalAccessibility } from "@/app/components/use-modal-accessibility";
import s from "./one-to-one-schedule-popup.module.css";

const REQUEST_TIMEOUT_MS = 12_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(?=.*\d)[0-9()\-\s]{5,20}$/;

const COUNTRY_CODES = [
  { code: "+91", country: "India" },
  { code: "+1", country: "United States / Canada" },
  { code: "+44", country: "United Kingdom" },
  { code: "+61", country: "Australia" },
  { code: "+64", country: "New Zealand" },
  { code: "+971", country: "United Arab Emirates" },
  { code: "+966", country: "Saudi Arabia" },
  { code: "+65", country: "Singapore" },
  { code: "+60", country: "Malaysia" },
  { code: "+974", country: "Qatar" },
  { code: "+968", country: "Oman" },
  { code: "+49", country: "Germany" },
  { code: "+33", country: "France" },
  { code: "+31", country: "Netherlands" },
  { code: "+41", country: "Switzerland" },
  { code: "+39", country: "Italy" },
  { code: "+34", country: "Spain" },
  { code: "+46", country: "Sweden" },
  { code: "+47", country: "Norway" },
  { code: "+45", country: "Denmark" },
  { code: "+353", country: "Ireland" },
  { code: "+27", country: "South Africa" },
  { code: "+254", country: "Kenya" },
] as const;

type FieldName = "name" | "email" | "phone" | "countryCode";
type FieldErrors = Partial<Record<FieldName, string>>;
type FormStatus = "idle" | "submitting" | "ready" | "error";
type PaymentAction = "idle" | "opening" | "verifying";

type OneToOneSchedulePopupProps = {
  open: boolean;
  onClose: () => void;
};

type FinalizationResponse = {
  leadId: string;
  consultationId: string;
  region: "india" | "worldwide";
  paymentRequired: boolean;
  paymentConfigured: boolean;
  paymentStatus: "not_required" | "pending" | "order_created" | "paid" | "failed";
  bookingLink?: string;
  message?: string | string[];
};

type ProgressResponse = {
  leadId: string;
  message?: string | string[];
};

type PaymentOrderResponse = {
  paid: boolean;
  bookingLink?: string;
  keyId?: string;
  orderId?: string;
  amount?: number;
  currency?: "INR";
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  message?: string | string[];
};

type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

let razorpayScriptPromise: Promise<void> | null = null;

function getErrorMessage(body: { message?: string | string[] } | null, fallback: string) {
  return Array.isArray(body?.message) ? body.message.join(" ") : body?.message || fallback;
}

function createOpaqueToken() {
  const bytes = new Uint8Array(32);
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Your browser cannot create a secure session. Please try a current browser.");
  }
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]');
    const script = existing ?? document.createElement("script");
    const finish = () => window.clearTimeout(timeout);
    const fail = (message: string) => {
      finish();
      if (!window.Razorpay && script.isConnected) script.remove();
      reject(new Error(message));
    };
    const timeout = window.setTimeout(
      () => fail("Payment checkout took too long to load. Please try again."),
      REQUEST_TIMEOUT_MS,
    );

    script.addEventListener("load", () => {
      if (window.Razorpay) {
        finish();
        resolve();
      } else {
        fail("Payment checkout did not load correctly. Please try again.");
      }
    }, { once: true });
    script.addEventListener("error", () => {
      fail("Payment checkout could not load. Please try again.");
    }, { once: true });

    if (!existing) {
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.dataset.razorpayCheckout = "true";
      document.head.appendChild(script);
    }
  }).catch((error) => {
    razorpayScriptPromise = null;
    throw error;
  });

  return razorpayScriptPromise;
}

export default function OneToOneSchedulePopup({ open, onClose }: OneToOneSchedulePopupProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [result, setResult] = useState<FinalizationResponse | null>(null);
  const [paymentAction, setPaymentAction] = useState<PaymentAction>("idle");
  const [paymentError, setPaymentError] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const sessionRef = useRef<{ continuationToken: string; idempotencyKey: string } | null>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const modalRef = useModalAccessibility(open, closeAndReset);

  const selectedCountry = COUNTRY_CODES.find((option) => option.code === countryCode) ?? COUNTRY_CODES[0];

  useEffect(() => {
    if (!open) return;
    if (status === "ready") successHeadingRef.current?.focus({ preventScroll: true });
    if (status === "error" && Object.keys(fieldErrors).length) errorSummaryRef.current?.focus({ preventScroll: true });
  }, [fieldErrors, open, status]);

  function closeAndReset() {
    if (status === "submitting" || paymentAction !== "idle") return;
    setName("");
    setEmail("");
    setPhone("");
    setCountryCode("+91");
    setStatus("idle");
    setFieldErrors({});
    setError("");
    setResult(null);
    setPaymentAction("idle");
    setPaymentError("");
    setLeadId(null);
    sessionRef.current = null;
    onClose();
  }

  function clearError(field: FieldName) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function getSession() {
    if (!sessionRef.current) {
      sessionRef.current = {
        continuationToken: createOpaqueToken(),
        idempotencyKey: createOpaqueToken(),
      };
    }
    return sessionRef.current;
  }

  function headers(includeIdempotency = false) {
    const session = getSession();
    return {
      "Content-Type": "application/json",
      "X-Lead-Continuation-Token": session.continuationToken,
      ...(includeIdempotency ? { "Idempotency-Key": session.idempotencyKey } : {}),
    };
  }

  async function requestJson<T>(endpoint: string, init: RequestInit) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(endpoint, { ...init, signal: controller.signal });
      const body = (await response.json().catch(() => null)) as (T & { message?: string | string[] }) | null;
      if (!response.ok || !body) throw new Error(getErrorMessage(body, "We could not complete that request. Please try again."));
      return body as T;
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        throw new Error("The service took too long to respond. Please check your connection and try again.");
      }
      throw requestError;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function validate() {
    const nextErrors: FieldErrors = {
      ...(name.trim().length < 2 ? { name: "Enter your name." } : {}),
      ...(!EMAIL_PATTERN.test(email.trim()) ? { email: "Enter a valid email address." } : {}),
      ...(!PHONE_PATTERN.test(phone.trim()) ? { phone: "Enter a valid phone number." } : {}),
      ...(!selectedCountry ? { countryCode: "Choose a country code." } : {}),
    };
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus("error");
      setError("Please correct the highlighted fields before continuing.");
      return false;
    }
    return true;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting" || !validate()) return;

    setStatus("submitting");
    setError("");
    try {
      const saved = await requestJson<ProgressResponse>(`${apiUrl}/leads`, {
        method: "POST",
        headers: headers(true),
        body: JSON.stringify({
          source: "one-to-one-booking-popup",
          completedStep: 1,
          name: name.trim(),
          email: email.trim(),
          phone: `${countryCode} ${phone.trim()}`,
          countryCode,
          country: selectedCountry.country,
          consent: true,
        }),
      });
      if (!saved.leadId) throw new Error("We could not save your details. Please try again.");
      setLeadId(saved.leadId);

      const finalization = await requestJson<FinalizationResponse>(
        `${apiUrl}/leads/${encodeURIComponent(saved.leadId)}/finalize`,
        { method: "POST", headers: headers() },
      );
      setResult(finalization);
      setStatus("ready");
    } catch (requestError) {
      setStatus("error");
      setError(requestError instanceof Error ? requestError.message : "We could not save your details. Please try again.");
    }
  }

  async function verifyPayment(response: RazorpayCheckoutResponse) {
    if (!leadId) {
      setPaymentAction("idle");
      setPaymentError("Your booking request could not be found. Please try again.");
      return;
    }
    setPaymentAction("verifying");
    setPaymentError("");
    try {
      const finalization = await requestJson<FinalizationResponse>(
        `${apiUrl}/leads/${encodeURIComponent(leadId)}/payment/verify`,
        {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        },
      );
      if (finalization.bookingLink) {
        window.location.assign(finalization.bookingLink);
        return;
      }
      setResult(finalization);
      setPaymentAction("idle");
    } catch (requestError) {
      setPaymentAction("idle");
      setPaymentError(requestError instanceof Error ? requestError.message : "We could not confirm your payment. Please try again.");
    }
  }

  async function startPayment() {
    if (!leadId || paymentAction !== "idle") return;
    setPaymentAction("opening");
    setPaymentError("");
    try {
      const order = await requestJson<PaymentOrderResponse>(
        `${apiUrl}/leads/${encodeURIComponent(leadId)}/payment-order`,
        { method: "POST", headers: headers() },
      );
      if (order.paid && order.bookingLink) {
        window.location.assign(order.bookingLink);
        setPaymentAction("idle");
        return;
      }
      if (!order.keyId || !order.orderId || !order.amount || !order.currency || !order.name || !order.description) {
        throw new Error("Payment checkout could not be prepared. Please try again.");
      }
      await loadRazorpayCheckout();
      if (!window.Razorpay) throw new Error("Payment checkout could not load. Please try again.");
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        prefill: order.prefill,
        handler: (response) => { void verifyPayment(response); },
        modal: { ondismiss: () => setPaymentAction((current) => current === "verifying" ? current : "idle") },
        theme: { color: "#174e49" },
      });
      checkout.open();
    } catch (requestError) {
      setPaymentAction("idle");
      setPaymentError(requestError instanceof Error ? requestError.message : "We could not start the payment. Please try again.");
    }
  }

  if (!open) return null;

  const isPaid = result?.paymentStatus === "paid";
  const canSchedule = Boolean(result?.bookingLink);

  return (
    <div className={s.backdrop} role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target && status !== "submitting" && paymentAction === "idle") closeAndReset();
    }}>
      <section ref={modalRef} className={s.dialog} role="dialog" aria-modal="true" aria-labelledby="one-to-one-schedule-title" aria-describedby="one-to-one-schedule-note">
        <button className={s.close} type="button" onClick={closeAndReset} aria-label="Close 1:1 scheduling form" disabled={status === "submitting" || paymentAction !== "idle"}>×</button>

        {status === "ready" && result ? (
          <div className={s.result}>
            <span className={s.resultMark} aria-hidden="true">{canSchedule ? "✓" : "01"}</span>
            <p className={s.eyebrow}>{canSchedule ? "YOUR TIME, YOUR WAY" : "ONE STEP LEFT"}</p>
            <h2 id="one-to-one-schedule-title" ref={successHeadingRef} tabIndex={-1}>
              {canSchedule ? "Choose a time for your 1:1." : "Complete your booking."}
            </h2>
            {canSchedule ? (
              <p id="one-to-one-schedule-note">Your details have been saved with Deepti’s practice. Choose the time that works best for you.</p>
            ) : (
              <p id="one-to-one-schedule-note">
                {result.paymentRequired
                  ? "Your India 1:1 is reserved for the ₹1,500 consultation payment. Once it is confirmed, your scheduling link will appear here."
                  : "Your details are with Deepti’s practice. The scheduling link is being configured and will be shared with you shortly."}
              </p>
            )}
            {canSchedule ? <a className={s.primaryAction} href={result.bookingLink} target="_blank" rel="noopener noreferrer">Choose a time <span aria-hidden="true">↗</span></a> : null}
            {result.paymentRequired && !isPaid ? (
              result.paymentConfigured ? (
                <button className={s.primaryAction} type="button" onClick={() => void startPayment()} disabled={paymentAction !== "idle"}>
                  {paymentAction === "opening" ? "Opening secure payment…" : paymentAction === "verifying" ? "Confirming payment…" : "Pay ₹1,500 securely"}
                </button>
              ) : <p className={s.paymentNotice} role="status">Secure payment is being configured. Please check back shortly.</p>
            ) : null}
            {paymentError ? <p className={s.formError} role="alert">{paymentError}</p> : null}
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <p className={s.eyebrow}>PRIVATE 1:1 WITH DEEPTI</p>
            <h2 id="one-to-one-schedule-title">Book a thoughtful first conversation.</h2>
            <p id="one-to-one-schedule-note" className={s.intro}>Tell us where to reach you. Your country code sets the appropriate booking step before you continue.</p>

            {Object.keys(fieldErrors).length ? (
              <div ref={errorSummaryRef} className={s.errorSummary} role="alert" tabIndex={-1}>
                <p>Please check the following:</p>
                <ul>{Object.entries(fieldErrors).map(([field, message]) => <li key={field}><a href={`#one-to-one-${field}`}>{message}</a></li>)}</ul>
              </div>
            ) : null}

            <div className={s.fields}>
              <label htmlFor="one-to-one-name"><span>Name</span><input id="one-to-one-name" name="name" type="text" autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); clearError("name"); }} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "one-to-one-name-error" : undefined} required />{fieldErrors.name ? <small id="one-to-one-name-error">{fieldErrors.name}</small> : null}</label>
              <label htmlFor="one-to-one-email"><span>Email</span><input id="one-to-one-email" name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => { setEmail(event.target.value); clearError("email"); }} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "one-to-one-email-error" : undefined} required />{fieldErrors.email ? <small id="one-to-one-email-error">{fieldErrors.email}</small> : null}</label>
              <div className={s.phoneRow}>
                <label htmlFor="one-to-one-country-code"><span>Country code</span><select id="one-to-one-country-code" name="countryCode" autoComplete="tel-country-code" value={countryCode} onChange={(event) => { setCountryCode(event.target.value); clearError("countryCode"); }} aria-invalid={Boolean(fieldErrors.countryCode)} aria-describedby={fieldErrors.countryCode ? "one-to-one-country-code-error" : undefined}>{COUNTRY_CODES.map((option) => <option key={option.code} value={option.code}>{option.country} ({option.code})</option>)}</select>{fieldErrors.countryCode ? <small id="one-to-one-country-code-error">{fieldErrors.countryCode}</small> : null}</label>
                <label htmlFor="one-to-one-phone"><span>Phone number</span><input id="one-to-one-phone" name="phone" type="tel" autoComplete="tel-national" inputMode="tel" value={phone} onChange={(event) => { setPhone(event.target.value); clearError("phone"); }} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "one-to-one-phone-error" : undefined} placeholder="Your local number" required />{fieldErrors.phone ? <small id="one-to-one-phone-error">{fieldErrors.phone}</small> : null}</label>
              </div>
            </div>

            {status === "error" && error ? <p className={s.formError} role="alert">{error}</p> : null}
            <button className={s.submit} type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Saving your details…" : "Continue"}<span aria-hidden="true">→</span></button>
            <p className={s.privacyNote}>By continuing, you agree that Deepti’s practice may use these details to arrange your 1:1. This is not medical advice.</p>
          </form>
        )}
      </section>
    </div>
  );
}
