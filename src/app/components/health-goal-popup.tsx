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

type HealthGoalDraft = {
  concerns: BodyConcernId[];
  goal: string;
  timeline: string;
  country: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
};

const EMPTY_DRAFT: HealthGoalDraft = {
  concerns: [],
  goal: "",
  timeline: "",
  country: "",
  name: "",
  email: "",
  phone: "",
  consent: false,
};

type HealthGoalPopupProps = {
  open: boolean;
  initialConcern?: BodyConcernId;
  onClose: () => void;
};

type ConsultationResponse = {
  consultationId: string;
  region: "india" | "worldwide";
  paymentRequired: boolean;
  paymentStatus: "not_required" | "pending";
  bookingLink?: string;
  message?: string;
};

export default function HealthGoalPopup({ open, initialConcern, onClose }: HealthGoalPopupProps) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<HealthGoalDraft>(() => ({
    ...EMPTY_DRAFT,
    concerns: initialConcern ? [initialConcern] : [],
  }));
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [bookingLink, setBookingLink] = useState<string | null>(null);
  const [consultationRegion, setConsultationRegion] = useState<"india" | "worldwide" | null>(null);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const introTitleRef = useRef<HTMLHeadingElement>(null);
  const questionTitleRef = useRef<HTMLLegendElement>(null);
  const successTitleRef = useRef<HTMLHeadingElement>(null);
  const modalRef = useModalAccessibility(open, closeAndResetIfComplete);

  useEffect(() => {
    if (!open) return;
    if (status === "success") successTitleRef.current?.focus({ preventScroll: true });
    else if (!started) introTitleRef.current?.focus({ preventScroll: true });
    else questionTitleRef.current?.focus({ preventScroll: true });
  }, [open, step, status, started]);

  const totalSteps = 4;
  const currentValid = step === 0
    ? Boolean(draft.name.trim() && draft.email.trim() && draft.phone.trim() && draft.consent)
    : step === 1
      ? draft.concerns.length > 0
      : step === 2
        ? Boolean(draft.goal)
        : Boolean(draft.timeline && draft.country.trim());

  function toggleConcern(concern: BodyConcernId) {
    setDraft((current) => ({
      ...current,
      concerns: current.concerns.includes(concern)
        ? current.concerns.filter((item) => item !== concern)
        : [...current.concerns, concern],
    }));
  }

  function closeAndResetIfComplete() {
    setStarted(false);
    setStep(0);
    setStatus("idle");
    setError("");
    setBookingLink(null);
    setConsultationRegion(null);
    setPaymentRequired(false);
    setDraft({ ...EMPTY_DRAFT, concerns: initialConcern ? [initialConcern] : [] });
    onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentValid || status === "submitting") return;
    setStatus("submitting");
    setError("");

    try {
      const response = await fetch(`${apiUrl}/consultations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concerns: draft.concerns,
          goal: draft.goal,
          timeline: draft.timeline,
          country: draft.country.trim(),
          name: draft.name.trim(),
          email: draft.email.trim(),
          phone: draft.phone.trim(),
          consent: draft.consent,
          source: "homepage-health-goal-popup",
        }),
      });
      const body = (await response.json().catch(() => null)) as (ConsultationResponse & { message?: string | string[] }) | null;
      if (!response.ok) {
        const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
        throw new Error(message || "We could not save your details. Please try again.");
      }
      if (!body?.consultationId || !body.region) {
        throw new Error("We could not confirm your enquiry. Please try again.");
      }
      setBookingLink(body.bookingLink || null);
      setConsultationRegion(body.region);
      setPaymentRequired(body.paymentRequired);
      setStatus("success");
    } catch (requestError) {
      setStatus("error");
      setError(requestError instanceof Error ? requestError.message : "We could not save your details. Please try again.");
    }
  }

  return (
    <>
      {open ? (
        <div className={s.backdrop} role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target && status !== "submitting") closeAndResetIfComplete();
        }}>
          <section ref={modalRef} className={s.dialog} role="dialog" aria-modal="true" aria-labelledby="health-goal-title" aria-describedby="health-goal-note">
            <button className={s.close} type="button" onClick={closeAndResetIfComplete} aria-label="Close health goals questionnaire">×</button>

            {status === "success" ? (
              <div className={s.success}>
                <span className={s.successMark} aria-hidden="true">✓</span>
                <p className={s.kicker}>{bookingLink ? "READY WHEN YOU ARE" : "DETAILS RECEIVED"}</p>
                <h2 id="health-goal-title" ref={successTitleRef} tabIndex={-1}>{bookingLink ? "Choose a time that works for you." : "Your details are saved."}</h2>
                <p>{bookingLink
                  ? "Your starting point is with Deepti’s practice. Use the secure scheduling link below to choose your conversation time."
                  : paymentRequired && consultationRegion === "india"
                    ? "Your starting point is with Deepti’s practice. The ₹1,500 India payment step will be connected next; the scheduling link will only be released after payment is confirmed."
                    : "Deepti’s practice now has your starting point and contact details. The next conversation can begin with what matters to you."}</p>
                {bookingLink ? <a className={s.successLink} href={bookingLink} target="_blank" rel="noopener noreferrer">Choose a time with Deepti <span aria-hidden="true">↗</span></a> : null}
                <button type="button" onClick={closeAndResetIfComplete}>Done</button>
              </div>
            ) : !started ? (
              <div className={s.intro}>
                <p className={s.kicker}>A PERSONAL HEALTH CHECK-IN</p>
                <h2 id="health-goal-title" ref={introTitleRef} tabIndex={-1}>Where would you like<br /><em>to feel more supported?</em></h2>
                <p className={s.introCopy}>Answer a few thoughtful questions so your first conversation can begin with the context that matters to you.</p>
                <div className={s.introFeatures} aria-label="Quiz details">
                  <span><i aria-hidden="true" />Takes about 2 minutes</span>
                  <span><i aria-hidden="true" />Built around your priorities</span>
                  <span><i aria-hidden="true" />No obligation to continue</span>
                </div>
                <button className={s.startButton} type="button" onClick={() => setStarted(true)}>Start your check-in <span aria-hidden="true">→</span></button>
                <p className={s.introNote}>Your details are used to respond to this enquiry. This check-in is not medical advice.</p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div className={s.progressHeader}>
                  <div>
                    <p className={s.kicker}>A CONVERSATION ABOUT YOUR HEALTH GOALS</p>
                    <p>Question {step + 1} of {totalSteps}</p>
                  </div>
                  <span aria-hidden="true">{String(step + 1).padStart(2, "0")} / 04</span>
                </div>
                <div className={s.progressTrack} aria-hidden="true"><span style={{ width: `${((step + 1) / totalSteps) * 100}%` }} /></div>

                <div className={s.questionPanel}>
                  {step === 0 ? (
                    <fieldset>
                      <legend ref={questionTitleRef} id="health-goal-title" tabIndex={-1}>Let’s start with you.</legend>
                      <p id="health-goal-note">Share your contact details first, then we’ll ask a few questions about what brought you here.</p>
                      <div className={s.contactFields}>
                        <label className={s.textField} htmlFor="health-goal-name"><span>Name</span><input id="health-goal-name" name="name" type="text" autoComplete="name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} required /></label>
                        <label className={s.textField} htmlFor="health-goal-email"><span>Email</span><input id="health-goal-email" name="email" type="email" autoComplete="email" inputMode="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} required /></label>
                        <label className={s.textField} htmlFor="health-goal-phone"><span>WhatsApp or phone</span><input id="health-goal-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="Include your country code" required /></label>
                      </div>
                      <label className={s.consent}>
                        <input type="checkbox" checked={draft.consent} onChange={(event) => setDraft((current) => ({ ...current, consent: event.target.checked }))} required />
                        <span>I agree that Deepti’s practice may use these details and my broad health goals to respond to this enquiry. This is not medical advice.</span>
                      </label>
                    </fieldset>
                  ) : null}

                  {step === 1 ? (
                    <fieldset>
                      <legend ref={questionTitleRef} id="health-goal-title" tabIndex={-1}>What would you like support with?</legend>
                      <p id="health-goal-note">Choose every area that feels relevant. You can change this later.</p>
                      <div className={s.optionGrid}>
                        {BODY_CONCERNS.map((concern) => (
                          <label key={concern.id} className={s.option} data-selected={draft.concerns.includes(concern.id)}>
                            <input type="checkbox" checked={draft.concerns.includes(concern.id)} onChange={() => toggleConcern(concern.id)} />
                            <span><small>{concern.number}</small>{concern.shortTitle}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}

                  {step === 2 ? (
                    <fieldset>
                      <legend ref={questionTitleRef} id="health-goal-title" tabIndex={-1}>What would feel like useful progress?</legend>
                      <p id="health-goal-note">Choose the outcome closest to what you want right now.</p>
                      <div className={s.singleOptions}>
                        {GOALS.map((goal) => (
                          <label key={goal} className={s.option} data-selected={draft.goal === goal}>
                            <input type="radio" name="goal" value={goal} checked={draft.goal === goal} onChange={() => setDraft((current) => ({ ...current, goal }))} />
                            <span>{goal}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}

                  {step === 3 ? (
                    <fieldset>
                      <legend ref={questionTitleRef} id="health-goal-title" tabIndex={-1}>When and where would you like to begin?</legend>
                      <p id="health-goal-note">Deepti is based in India and consults online with people around the world.</p>
                      <div className={s.singleOptions}>
                        {TIMELINES.map((timeline) => (
                          <label key={timeline} className={s.option} data-selected={draft.timeline === timeline}>
                            <input type="radio" name="timeline" value={timeline} checked={draft.timeline === timeline} onChange={() => setDraft((current) => ({ ...current, timeline }))} />
                            <span>{timeline}</span>
                          </label>
                        ))}
                      </div>
                      <label className={s.textField} htmlFor="health-goal-country">
                        <span>Country or region</span>
                        <input id="health-goal-country" name="country" type="text" autoComplete="country-name" value={draft.country} onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))} placeholder="Where will you join from?" required />
                      </label>
                    </fieldset>
                  ) : null}
                </div>

                {status === "error" ? <p className={s.error} role="alert">{error}</p> : null}

                <div className={s.actions}>
                  <button className={s.back} type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || status === "submitting"}>Back</button>
                  {step < totalSteps - 1 ? (
                    <button className={s.next} type="button" onClick={() => setStep((current) => Math.min(totalSteps - 1, current + 1))} disabled={!currentValid}>Continue <span aria-hidden="true">→</span></button>
                  ) : (
                    <button className={s.next} type="submit" disabled={!currentValid || status === "submitting"}>{status === "submitting" ? "Saving securely…" : "Share my goals"}<span aria-hidden="true">→</span></button>
                  )}
                </div>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
