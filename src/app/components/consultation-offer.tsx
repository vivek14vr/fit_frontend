"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import s from "./consultation-offer.module.css";

const INTERNATIONAL_CALENDAR = "https://cal.com/deeptisherawat/1-on-1-health-consultation-international";
const INDIA_CALENDAR = "https://cal.com/deeptisherawat/1-on-1-health-consultation";
const RAZORPAY_LINK = "https://razorpay.me/@deeptisherawat11";
const PAYMENT_STARTED_KEY = "deepti-india-consultation-payment-started";
const PAYMENT_UNLOCKED_KEY = "deepti-india-consultation-payment-unlocked";

type Region = "india" | "international";

function detectRegion(): Region {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone?.toLowerCase();
  return timezone === "asia/kolkata" || timezone === "asia/calcutta"
    ? "india"
    : "international";
}

function readSessionFlag(key: string) {
  try {
    return window.sessionStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeSessionFlag(key: string) {
  try {
    window.sessionStorage.setItem(key, "true");
  } catch {
    // Private browsing modes can block sessionStorage. The in-memory state still works.
  }
}

function ExternalLink({ href, children, className, onClick }: { href: string; children: ReactNode; className: string; onClick?: () => void }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

export default function ConsultationOffer() {
  const [region, setRegion] = useState<Region | null>(null);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [paymentUnlocked, setPaymentUnlocked] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const detectedRegion = detectRegion();
      setRegion(detectedRegion);

      if (detectedRegion === "india") {
        setPaymentStarted(readSessionFlag(PAYMENT_STARTED_KEY));
        setPaymentUnlocked(readSessionFlag(PAYMENT_UNLOCKED_KEY));
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function handlePaymentLinkClick() {
    setPaymentStarted(true);
    writeSessionFlag(PAYMENT_STARTED_KEY);
  }

  function handlePaymentConfirmation() {
    setPaymentUnlocked(true);
    writeSessionFlag(PAYMENT_UNLOCKED_KEY);
  }

  const regionControl = <label className={s.regionControl}>Where are you booking from?<select value={region ?? "international"} onChange={event => { setRegion(event.target.value as Region); setPaymentStarted(false); setPaymentUnlocked(false); }}><option value="india">India</option><option value="international">US / International</option></select></label>;

  if (!region) {
    return (
      <div className={`${s.offer} ${s.loading}`} role="status" aria-live="polite">
        Preparing your consultation options…
      </div>
    );
  }

  if (region === "international") {
    return (
      <div className={s.offer} data-region="international">
        {regionControl}
        <p className={s.eyebrow}>US &amp; INTERNATIONAL</p>
        <h3>Book a free 1:1 consultation.</h3>
        <p className={s.copy}>
          Choose a time that works for you. This international consultation is free to book for now.
        </p>
        <ExternalLink href={INTERNATIONAL_CALENDAR} className={s.primaryAction}>
          Choose a time with Deepti
        </ExternalLink>
        <p className={s.note}>You will be taken to Deepti&apos;s secure Cal.com booking page.</p>
      </div>
    );
  }

  return (
    <div className={s.offer} data-region="india">
      {regionControl}
      <p className={s.eyebrow}>INDIA / DOMESTIC</p>
      <h3>1:1 Health Assessment with Deepti.</h3>
      <p className={s.copy}>
        A focused first consultation to understand your history, priorities and the right starting point for you.
      </p>
      <div className={s.priceRow}>
        <span>Direct consultation fee</span>
        <strong>₹1,500</strong>
      </div>
        <ExternalLink href={RAZORPAY_LINK} className={s.paymentAction} onClick={handlePaymentLinkClick}>
        Pay ₹1,500 via Razorpay
      </ExternalLink>
      <div className={s.unlockBox}>
        <p>After paying ₹1,500, return here to continue to scheduling. This confirmation is your acknowledgement; payment is not verified on this website.</p>
        <button type="button" className={s.unlockAction} disabled={!paymentStarted} onClick={handlePaymentConfirmation}>
          I&apos;ve completed payment
        </button>
        {!paymentStarted && <small>Open the Razorpay payment page first.</small>}
      </div>
      {paymentUnlocked && (
        <div className={s.calendarBox} role="status" aria-live="polite">
          <p>You’ve acknowledged payment. Continue to choose your consultation time.</p>
          <ExternalLink href={INDIA_CALENDAR} className={s.primaryAction}>
            Open the domestic calendar
          </ExternalLink>
        </div>
      )}
      <p className={s.note}>You will be taken to Razorpay for payment and Cal.com for scheduling.</p>
    </div>
  );
}
