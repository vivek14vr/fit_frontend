"use client";

import { useEffect, useState } from "react";
import BrandFlowerMark from "./brand-flower-mark";

const MINIMUM_DISPLAY_MS = 650;
const MAXIMUM_DISPLAY_MS = 2400;
const EXIT_DURATION_MS = 460;

export default function EntryLoader() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const documentRoot = document.documentElement;
    documentRoot.dataset.entryStage = "loading";
    const startedAt = performance.now();
    let returning = false;
    try { returning = sessionStorage.getItem("deepti-intro-seen") === "true"; } catch { /* Storage is optional. */ }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minimumDisplay = reducedMotion || returning ? 0 : MINIMUM_DISPLAY_MS;
    const maximumDisplay = reducedMotion ? 800 : MAXIMUM_DISPLAY_MS;
    let finished = false;
    let exitTimer: number | undefined;
    let removeTimer: number | undefined;

    const finish = () => {
      if (finished) return;
      finished = true;

      const remaining = Math.max(0, minimumDisplay - (performance.now() - startedAt));
      exitTimer = window.setTimeout(() => {
        documentRoot.dataset.entryStage = "ready";
        try { sessionStorage.setItem("deepti-intro-seen", "true"); } catch { /* Storage is optional. */ }
        setExiting(true);
        removeTimer = window.setTimeout(() => {
          documentRoot.dataset.entryStage = "complete";
          setVisible(false);
        }, reducedMotion ? 0 : EXIT_DURATION_MS);
      }, remaining);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }

    const fallbackTimer = window.setTimeout(finish, maximumDisplay);

    return () => {
      window.removeEventListener("load", finish);
      window.clearTimeout(fallbackTimer);
      if (exitTimer) window.clearTimeout(exitTimer);
      if (removeTimer) window.clearTimeout(removeTimer);
      if (documentRoot.dataset.entryStage === "loading") delete documentRoot.dataset.entryStage;
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`entry-loader${exiting ? " entry-loader--exiting" : ""}`} role="status" aria-live="polite">
      <div className="entry-loader__content">
        <div className="entry-loader__flower" aria-hidden="true">
          <span className="entry-loader__halo" />
          <BrandFlowerMark className="entry-loader__logo" />
        </div>
        <p className="entry-loader__brand">DEEPTI SHERAWAT</p>
        <p className="entry-loader__descriptor">Nutritionist · Ayurveda · Modern science</p>
        <span className="entry-loader__sr-only">Loading the Deepti Sherawat website</span>
      </div>
    </div>
  );
}
