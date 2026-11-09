"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="dashboard-page dashboard-loading">
      <section className="dashboard-loading-card" role="alert" aria-labelledby="global-error-title">
        <p className="dashboard-eyebrow">TEMPORARILY UNAVAILABLE</p>
        <h1 id="global-error-title">Something needs another try.</h1>
        <p className="dashboard-loading-help">
          The workspace could not finish rendering. Your saved data is still protected.
        </p>
        <button className="dashboard-retry-button" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
