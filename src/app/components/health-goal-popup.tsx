"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { apiUrl } from "@/app/lib/auth-client";
import { useModalAccessibility } from "@/app/components/use-modal-accessibility";
import { BODY_CONCERNS, type BodyConcernId } from "@/app/components/body-concerns";
import s from "./health-goal-popup.module.css";

const GOALS = [
  "Feel more energetic and consistent",
  "Improve digestion and daily comfort",
  "Build sustainable fat-loss habits",
  "Support healthier metabolic markers",
  "Feel more confident about food choices",
  "Create a routine that works in real life",
] as const;

const TIMELINES = ["As soon as possible", "Within the next month", "I am exploring for now"] as const;
const REQUEST_TIMEOUT_MS = 12_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{7,25}$/;

type HealthGoalDraft = {
  concerns: BodyConcernId[];
  goal: string;
  timeline: string;
  country: string;
  region: "india" | "worldwide" | "";
  name: string;
  email: string;
  phone: string;
  consent: boolean;
};

type FieldName = keyof HealthGoalDraft;
type FieldErrors = Partial<Record<FieldName, string>>;

const EMPTY_DRAFT: HealthGoalDraft = {
  concerns: [],
  goal: "",
  timeline: "",
  country: "",
  region: "",
  name: "",
  email: "",
  phone: "",
  consent: false,
};

type HealthGoalPopupProps = {
  open: boolean;
  initialConcern?: BodyConcernId;
  flow?: "health" | "consultation";
  onClose: () => void;
};

type LeadProgressResponse = {
  leadId: string;
  completedStep: number;
  status: string;
  message?: string | string[];
};

type LeadFinalizationResponse = {
  leadId: string;
  consultationId: string;
  region: "india" | "worldwide";
  paymentRequired: boolean;
  paymentConfigured: boolean;
  paymentStatus: "not_required" | "pending" | "order_created" | "paid" | "failed";
  bookingLink?: string;
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
    const timeout = window.setTimeout(() => fail("Payment checkout took too long to load. Please try again."), REQUEST_TIMEOUT_MS);

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

export default function HealthGoalPopup({ open, initialConcern, flow = "health", onClose }: HealthGoalPopupProps) {
  const isConsultationBooking = flow === "consultation";
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<HealthGoalDraft>(() => ({
    ...EMPTY_DRAFT,
    concerns: initialConcern ? [initialConcern] : [],
  }));
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [bookingLink, setBookingLink] = useState<string | null>(null);
  const [consultationRegion, setConsultationRegion] = useState<"india" | "worldwide" | null>(null);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentConfigured, setPaymentConfigured] = useState(false);
  const [paymentAction, setPaymentAction] = useState<"idle" | "opening" | "verifying">("idle");
  const [paymentError, setPaymentError] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const leadSessionRef = useRef<{ continuationToken: string; idempotencyKey: string } | null>(null);
  const introTitleRef = useRef<HTMLHeadingElement>(null);
  const questionTitleRef = useRef<HTMLLegendElement>(null);
  const successTitleRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const modalRef = useModalAccessibility(open, closeAndResetIfComplete);

  useEffect(() => {
    if (!open) return;
    if (status === "success") successTitleRef.current?.focus({ preventScroll: true });
    else if (!started) introTitleRef.current?.focus({ preventScroll: true });
    else if (Object.keys(fieldErrors).length) errorSummaryRef.current?.focus({ preventScroll: true });
    else questionTitleRef.current?.focus({ preventScroll: true });
  }, [fieldErrors, open, status, started, step]);

  const totalSteps = isConsultationBooking ? 1 : 4;

  function updateDraft<K extends FieldName>(key: K, value: HealthGoalDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function errorsForCurrentStep(): FieldErrors {
    if (step === 0) {
      return {
        ...(draft.name.trim().length < 2 ? { name: "Enter your name." } : {}),
        ...(!EMAIL_PATTERN.test(draft.email.trim()) ? { email: "Enter a valid email address." } : {}),
        ...(!PHONE_PATTERN.test(draft.phone.trim()) ? { phone: "Enter a valid phone number with country code." } : {}),
        ...(!draft.consent ? { consent: "Consent is required before we can save your enquiry." } : {}),
        ...(isConsultationBooking && draft.country.trim().length < 2 ? { country: "Enter your country or region." } : {}),
        ...(isConsultationBooking && !draft.region ? { region: "Tell us whether you will join from India or elsewhere." } : {}),
      };
    }
    if (step === 1) return draft.concerns.length ? {} : { concerns: "Choose at least one area for support." };
    if (step === 2) return draft.goal.trim().length >= 3 ? {} : { goal: "Choose the outcome that matters most right now." };
    return {
      ...(!draft.timeline ? { timeline: "Choose when you would like to begin." } : {}),
      ...(draft.country.trim().length < 2 ? { country: "Enter your country or region." } : {}),
      ...(!draft.region ? { region: "Tell us whether you will join from India or elsewhere." } : {}),
    };
  }

  function validateCurrentStep() {
    const nextErrors = errorsForCurrentStep();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus("error");
      setError("Please correct the highlighted fields before continuing.");
      return false;
    }
    return true;
  }

  function toggleConcern(concern: BodyConcernId) {
    setDraft((current) => ({
      ...current,
      concerns: current.concerns.includes(concern)
        ? current.concerns.filter((item) => item !== concern)
        : [...current.concerns, concern],
    }));
    setFieldErrors((current) => ({ ...current, concerns: undefined }));
  }

  function closeAndResetIfComplete() {
    if (status === "submitting" || paymentAction !== "idle") return;
    setStarted(false);
    setStep(0);
    setStatus("idle");
    setError("");
    setFieldErrors({});
    setBookingLink(null);
    setConsultationRegion(null);
    setPaymentRequired(false);
    setPaymentConfigured(false);
    setPaymentAction("idle");
    setPaymentError("");
    setLeadId(null);
    leadSessionRef.current = null;
    setDraft({ ...EMPTY_DRAFT, concerns: initialConcern ? [initialConcern] : [] });
    onClose();
  }

  function getLeadSession() {
    if (!leadSessionRef.current) {
      leadSessionRef.current = {
        continuationToken: createOpaqueToken(),
        idempotencyKey: createOpaqueToken(),
      };
    }
    return leadSessionRef.current;
  }

  function continuationHeaders(includeIdempotency = false) {
    const session = getLeadSession();
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
      if (!response.ok || !body) {
        throw new Error(getErrorMessage(body, "We could not complete that request. Please try again."));
      }
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

  function payloadForCompletedStep(completedStep: number) {
    const payload: Record<string, unknown> = {
      source: isConsultationBooking ? "one-to-one-booking-popup" : "homepage-health-goal-popup",
      completedStep,
    };

    if (completedStep >= 1) Object.assign(payload, {
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      consent: draft.consent,
    });
    if (isConsultationBooking) Object.assign(payload, {
      country: draft.country.trim(),
      region: draft.region,
    });
    if (!isConsultationBooking && completedStep >= 2) payload.concerns = draft.concerns;
    if (!isConsultationBooking && completedStep >= 3) payload.goal = draft.goal;
    if (!isConsultationBooking && completedStep >= 4) Object.assign(payload, {
      timeline: draft.timeline,
      country: draft.country.trim(),
      region: draft.region,
    });
    return payload;
  }

  async function saveLeadProgress(completedStep: number) {
    const isCreate = !leadId;
    const endpoint = leadId ? `${apiUrl}/leads/${encodeURIComponent(leadId)}` : `${apiUrl}/leads`;
    const body = await requestJson<LeadProgressResponse>(endpoint, {
      method: isCreate ? "POST" : "PATCH",
      headers: continuationHeaders(isCreate),
      body: JSON.stringify(payloadForCompletedStep(completedStep)),
    });
    if (!body.leadId) throw new Error("We could not save this step. Please try again.");
    setLeadId(body.leadId);
    return body.leadId;
  }

  function applyFinalization(result: LeadFinalizationResponse) {
    setLeadId(result.leadId);
    setBookingLink(result.bookingLink || null);
    setConsultationRegion(result.region);
    setPaymentRequired(result.paymentRequired);
    setPaymentConfigured(result.paymentConfigured);
    setStatus("success");
  }

  async function continueToNextStep() {
    if (status === "submitting" || !validateCurrentStep()) return;
    setStatus("submitting");
    setError("");
    try {
      await saveLeadProgress(step + 1);
      setStep((current) => Math.min(totalSteps - 1, current + 1));
      setStatus("idle");
    } catch (requestError) {
      setStatus("error");
      setError(requestError instanceof Error ? requestError.message : "We could not save this step. Please try again.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting" || !validateCurrentStep()) return;
    setStatus("submitting");
    setError("");
    try {
      const activeLeadId = await saveLeadProgress(totalSteps);
      const result = await requestJson<LeadFinalizationResponse>(`${apiUrl}/leads/${encodeURIComponent(activeLeadId)}/finalize`, {
        method: "POST",
        headers: continuationHeaders(),
      });
      applyFinalization(result);
    } catch (requestError) {
      setStatus("error");
      setError(requestError instanceof Error ? requestError.message : "We could not submit your details. Please try again.");
    }
  }

  async function verifyPayment(response: RazorpayCheckoutResponse) {
    if (!leadId) {
      setPaymentAction("idle");
      setPaymentError("Your enquiry could not be found. Please try again.");
      return;
    }
    setPaymentAction("verifying");
    setPaymentError("");
    try {
      const result = await requestJson<LeadFinalizationResponse>(`${apiUrl}/leads/${encodeURIComponent(leadId)}/payment/verify`, {
        method: "POST",
        headers: continuationHeaders(),
        body: JSON.stringify({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }),
      });
      if (result.bookingLink) {
        window.location.assign(result.bookingLink);
        return;
      }
      applyFinalization(result);
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
      const order = await requestJson<PaymentOrderResponse>(`${apiUrl}/leads/${encodeURIComponent(leadId)}/payment-order`, {
        method: "POST",
        headers: continuationHeaders(),
      });
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
        theme: { color: "#155b54" },
      });
      checkout.open();
    } catch (requestError) {
      setPaymentAction("idle");
      setPaymentError(requestError instanceof Error ? requestError.message : "We could not start the payment. Please try again.");
    }
  }

  return open ? (
    <div className={s.backdrop} role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target && status !== "submitting" && paymentAction === "idle") closeAndResetIfComplete();
    }}>
      <section ref={modalRef} className={s.dialog} role="dialog" aria-modal="true" aria-labelledby="health-goal-title" aria-describedby="health-goal-note">
        <button className={s.close} type="button" onClick={closeAndResetIfComplete} aria-label={isConsultationBooking ? "Close 1:1 consultation form" : "Close health goals questionnaire"} disabled={status === "submitting" || paymentAction !== "idle"}>×</button>

        {status === "success" ? (
          <div className={s.success}>
            <span className={s.successMark} aria-hidden="true">✓</span>
            <p className={s.kicker}>{bookingLink ? "READY WHEN YOU ARE" : "DETAILS RECEIVED"}</p>
            <h2 id="health-goal-title" ref={successTitleRef} tabIndex={-1}>{bookingLink ? "Choose a time that works for you." : "Your details are saved."}</h2>
            <p>{bookingLink
              ? "Your starting point is with Deepti’s practice. Use the secure scheduling link below to choose your conversation time."
              : paymentRequired && consultationRegion === "india"
                ? "Your consultation is ready for the ₹1,500 India payment. Your scheduling link is released only after payment is securely confirmed."
                : "Deepti’s practice now has your starting point and contact details."}</p>
            {bookingLink ? <a className={s.successLink} href={bookingLink} target="_blank" rel="noopener noreferrer">Choose a time with Deepti <span aria-hidden="true">↗</span></a> : null}
            {paymentRequired && consultationRegion === "india" ? (
              paymentConfigured ? (
                <>
                  <button className={s.paymentButton} type="button" onClick={() => void startPayment()} disabled={paymentAction !== "idle"}>
                    {paymentAction === "opening" ? "Opening secure payment…" : paymentAction === "verifying" ? "Confirming payment…" : "Pay ₹1,500 securely"}
                  </button>
                  {paymentError ? <p className={s.error} role="alert">{paymentError}</p> : null}
                </>
              ) : <p className={s.paymentNotice} role="status">Secure payment checkout is being configured. Deepti’s practice will share the next step shortly.</p>
            ) : null}
            <button type="button" onClick={closeAndResetIfComplete} disabled={paymentAction !== "idle"}>Done</button>
          </div>
        ) : !started ? (
          <div className={s.intro}>
            <p className={s.kicker}>{isConsultationBooking ? "A PRIVATE 1:1 CONVERSATION" : "A PERSONAL HEALTH CHECK-IN"}</p>
            <h2 id="health-goal-title" ref={introTitleRef} tabIndex={-1}>{isConsultationBooking ? <>Begin with<br /><em>your first conversation.</em></> : <>Where would you like<br /><em>to feel more supported?</em></>}</h2>
            <p className={s.introCopy}>{isConsultationBooking ? "Share your contact details and location to receive the right next step for a considered 1:1 consultation with Deepti." : "Answer a few thoughtful questions so your first conversation can begin with the context that matters to you."}</p>
            <div className={s.introFeatures} aria-label="Quiz details">
              <span><i aria-hidden="true" />{isConsultationBooking ? "Takes about a minute" : "Takes about 2 minutes"}</span>
              <span><i aria-hidden="true" />{isConsultationBooking ? "A private 1:1 starting point" : "Built around your priorities"}</span>
              <span><i aria-hidden="true" />No obligation to continue</span>
            </div>
            <button className={s.startButton} type="button" onClick={() => setStarted(true)}>{isConsultationBooking ? "Book a 1:1 with Deepti" : "Start your check-in"} <span aria-hidden="true">→</span></button>
            <p className={s.introNote}>Your details are used to respond to this enquiry. This check-in is not medical advice.</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className={s.progressHeader}>
              <div>
                <p className={s.kicker}>{isConsultationBooking ? "A 1:1 WITH DEEPTI" : "A CONVERSATION ABOUT YOUR HEALTH GOALS"}</p>
                <p>Question {step + 1} of {totalSteps}</p>
              </div>
              <span aria-hidden="true">{String(step + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}</span>
            </div>
            <div className={s.progressTrack} aria-hidden="true"><span style={{ width: `${((step + 1) / totalSteps) * 100}%` }} /></div>

            {Object.keys(fieldErrors).length ? (
              <div ref={errorSummaryRef} className={s.errorSummary} tabIndex={-1} role="alert">
                <p>Please check the following:</p>
                <ul>{Object.entries(fieldErrors).map(([field, message]) => <li key={field}><a href={`#health-goal-${field}`}>{message}</a></li>)}</ul>
              </div>
            ) : null}

            <div className={s.questionPanel}>
              {step === 0 ? (
                <fieldset>
                  <legend ref={questionTitleRef} id="health-goal-title" tabIndex={-1}>{isConsultationBooking ? "Let’s arrange your first conversation." : "Let’s start with you."}</legend>
                  <p id="health-goal-note">{isConsultationBooking ? "Share your details and where you will join from. We will show the appropriate next step before scheduling." : "Share your contact details first, then we’ll ask a few questions about what brought you here."}</p>
                  <div className={s.contactFields}>
                    <label className={s.textField} htmlFor="health-goal-name"><span>Name</span><input id="health-goal-name" name="name" type="text" autoComplete="name" value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "health-goal-name-error" : undefined} required />{fieldErrors.name ? <small id="health-goal-name-error" className={s.fieldError}>{fieldErrors.name}</small> : null}</label>
                    <label className={s.textField} htmlFor="health-goal-email"><span>Email</span><input id="health-goal-email" name="email" type="email" autoComplete="email" inputMode="email" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "health-goal-email-error" : undefined} required />{fieldErrors.email ? <small id="health-goal-email-error" className={s.fieldError}>{fieldErrors.email}</small> : null}</label>
                    <label className={s.textField} htmlFor="health-goal-phone"><span>WhatsApp or phone</span><input id="health-goal-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "health-goal-phone-error" : undefined} placeholder="Include your country code" required />{fieldErrors.phone ? <small id="health-goal-phone-error" className={s.fieldError}>{fieldErrors.phone}</small> : null}</label>
                  </div>
                  <label className={s.consent}>
                    <input id="health-goal-consent" type="checkbox" checked={draft.consent} onChange={(event) => updateDraft("consent", event.target.checked)} aria-invalid={Boolean(fieldErrors.consent)} aria-describedby={fieldErrors.consent ? "health-goal-consent-error" : undefined} required />
                    <span>I agree that Deepti’s practice may use these details and my broad health goals to respond to this enquiry. This is not medical advice.</span>
                  </label>
                  {fieldErrors.consent ? <p id="health-goal-consent-error" className={s.fieldError}>{fieldErrors.consent}</p> : null}
                  {isConsultationBooking ? <>
                    <label className={s.textField} htmlFor="health-goal-country">
                      <span>Country or region</span>
                      <input id="health-goal-country" name="country" type="text" autoComplete="country-name" value={draft.country} onChange={(event) => updateDraft("country", event.target.value)} aria-invalid={Boolean(fieldErrors.country)} aria-describedby={fieldErrors.country ? "health-goal-country-error" : undefined} placeholder="Where will you join from?" required />
                      {fieldErrors.country ? <small id="health-goal-country-error" className={s.fieldError}>{fieldErrors.country}</small> : null}
                    </label>
                    <div id="health-goal-region" className={s.regionChoices} role="group" aria-labelledby="health-goal-region-label" aria-describedby={fieldErrors.region ? "health-goal-region-error" : undefined}>
                      <span id="health-goal-region-label">Will you join from India?</span>
                      <label className={s.option} data-selected={draft.region === "india"}><input type="radio" name="region" checked={draft.region === "india"} onChange={() => updateDraft("region", "india")} /><span>Yes, I am joining from India</span></label>
                      <label className={s.option} data-selected={draft.region === "worldwide"}><input type="radio" name="region" checked={draft.region === "worldwide"} onChange={() => updateDraft("region", "worldwide")} /><span>No, I am joining from outside India</span></label>
                    </div>
                    {fieldErrors.region ? <p id="health-goal-region-error" className={s.fieldError}>{fieldErrors.region}</p> : null}
                  </> : null}
                </fieldset>
              ) : null}

              {step === 1 ? (
                <fieldset>
                  <legend ref={questionTitleRef} id="health-goal-title" tabIndex={-1}>What would you like support with?</legend>
                  <p id="health-goal-note">Choose every area that feels relevant. You can change this later.</p>
                  <div id="health-goal-concerns" className={s.optionGrid} aria-describedby={fieldErrors.concerns ? "health-goal-concerns-error" : undefined}>
                    {BODY_CONCERNS.map((concern) => (
                      <label key={concern.id} className={s.option} data-selected={draft.concerns.includes(concern.id)}>
                        <input type="checkbox" checked={draft.concerns.includes(concern.id)} onChange={() => toggleConcern(concern.id)} />
                        <span><small>{concern.number}</small>{concern.shortTitle}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.concerns ? <p id="health-goal-concerns-error" className={s.fieldError}>{fieldErrors.concerns}</p> : null}
                </fieldset>
              ) : null}

              {step === 2 ? (
                <fieldset>
                  <legend ref={questionTitleRef} id="health-goal-title" tabIndex={-1}>What would feel like useful progress?</legend>
                  <p id="health-goal-note">Choose the outcome closest to what you want right now.</p>
                  <div id="health-goal-goal" className={s.singleOptions} aria-describedby={fieldErrors.goal ? "health-goal-goal-error" : undefined}>
                    {GOALS.map((goal) => (
                      <label key={goal} className={s.option} data-selected={draft.goal === goal}>
                        <input type="radio" name="goal" value={goal} checked={draft.goal === goal} onChange={() => updateDraft("goal", goal)} />
                        <span>{goal}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.goal ? <p id="health-goal-goal-error" className={s.fieldError}>{fieldErrors.goal}</p> : null}
                </fieldset>
              ) : null}

              {step === 3 ? (
                <fieldset>
                  <legend ref={questionTitleRef} id="health-goal-title" tabIndex={-1}>When and where would you like to begin?</legend>
                  <p id="health-goal-note">Deepti is based in India and consults online with people around the world.</p>
                  <div id="health-goal-timeline" className={s.singleOptions} aria-describedby={fieldErrors.timeline ? "health-goal-timeline-error" : undefined}>
                    {TIMELINES.map((timeline) => (
                      <label key={timeline} className={s.option} data-selected={draft.timeline === timeline}>
                        <input type="radio" name="timeline" value={timeline} checked={draft.timeline === timeline} onChange={() => updateDraft("timeline", timeline)} />
                        <span>{timeline}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.timeline ? <p id="health-goal-timeline-error" className={s.fieldError}>{fieldErrors.timeline}</p> : null}
                  <label className={s.textField} htmlFor="health-goal-country">
                    <span>Country or region</span>
                    <input id="health-goal-country" name="country" type="text" autoComplete="country-name" value={draft.country} onChange={(event) => updateDraft("country", event.target.value)} aria-invalid={Boolean(fieldErrors.country)} aria-describedby={fieldErrors.country ? "health-goal-country-error" : undefined} placeholder="Where will you join from?" required />
                    {fieldErrors.country ? <small id="health-goal-country-error" className={s.fieldError}>{fieldErrors.country}</small> : null}
                  </label>
                  <div id="health-goal-region" className={s.regionChoices} role="group" aria-labelledby="health-goal-region-label" aria-describedby={fieldErrors.region ? "health-goal-region-error" : undefined}>
                    <span id="health-goal-region-label">Will you join from India?</span>
                    <label className={s.option} data-selected={draft.region === "india"}><input type="radio" name="region" checked={draft.region === "india"} onChange={() => updateDraft("region", "india")} /><span>Yes, I am joining from India</span></label>
                    <label className={s.option} data-selected={draft.region === "worldwide"}><input type="radio" name="region" checked={draft.region === "worldwide"} onChange={() => updateDraft("region", "worldwide")} /><span>No, I am joining from outside India</span></label>
                  </div>
                  {fieldErrors.region ? <p id="health-goal-region-error" className={s.fieldError}>{fieldErrors.region}</p> : null}
                </fieldset>
              ) : null}
            </div>

            {status === "error" && error ? <p className={s.error} role="alert">{error}</p> : null}

            <div className={s.actions}>
              <button className={s.back} type="button" onClick={() => { setFieldErrors({}); setError(""); setStatus("idle"); setStep((current) => Math.max(0, current - 1)); }} disabled={step === 0 || status === "submitting"}>Back</button>
              {step < totalSteps - 1 ? (
                <button className={s.next} type="button" onClick={() => void continueToNextStep()} disabled={status === "submitting"}>{status === "submitting" ? "Saving…" : "Continue"} <span aria-hidden="true">→</span></button>
              ) : (
                <button className={s.next} type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Saving securely…" : isConsultationBooking ? "Continue to scheduling" : "Share my goals"}<span aria-hidden="true">→</span></button>
              )}
            </div>
          </form>
        )}
      </section>
    </div>
  ) : null;
}
