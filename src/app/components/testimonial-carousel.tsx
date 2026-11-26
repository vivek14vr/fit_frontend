"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useId, useState, type KeyboardEvent } from "react";
import { apiUrl } from "@/app/lib/auth-client";
import styles from "./testimonial-carousel.module.css";

export type TestimonialPlacement = "homepage" | "testimonials";
export type TestimonialVariant = "homepage" | "page";

type Testimonial = {
  id: string;
  title: string;
  altText: string;
  imageUrl: string;
  placements: TestimonialPlacement[];
  status: "published";
  sortOrder: number;
};

type TestimonialCarouselProps = {
  placement: TestimonialPlacement;
  variant?: TestimonialVariant;
  heading?: string;
  description?: string;
};

function isTestimonial(value: unknown): value is Testimonial {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Testimonial>;
  return Boolean(
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.altText === "string" &&
    typeof item.imageUrl === "string",
  );
}

export default function TestimonialCarousel({
  placement,
  variant = "page",
  heading = "Real experiences, shared with care.",
  description = "A small collection of client reflections, published with permission and without promising the same outcome for everyone.",
}: TestimonialCarouselProps) {
  const headingId = useId();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 8_000);

    async function loadTestimonials() {
      try {
        const response = await fetch(
          `${apiUrl}/testimonials?placement=${encodeURIComponent(placement)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const body = (await response.json().catch(() => null)) as { testimonials?: unknown } | null;
        if (!response.ok) throw new Error("Unable to load testimonials.");
        const nextItems = Array.isArray(body?.testimonials) ? body.testimonials.filter(isTestimonial) : [];
        if (!controller.signal.aborted) {
          setItems(nextItems);
          setActiveIndex(0);
        }
      } catch (requestError) {
        if (!isActive) return;
        setError(
          timedOut
            ? "Stories are taking too long to load. Please try again."
            : requestError instanceof Error
              ? requestError.message
              : "Unable to load testimonials.",
        );
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    const startId = window.setTimeout(() => {
      setIsLoading(true);
      setError("");
      void loadTestimonials();
    }, 0);
    return () => {
      isActive = false;
      controller.abort();
      window.clearTimeout(timeoutId);
      window.clearTimeout(startId);
    };
  }, [placement]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  const move = useCallback((direction: 1 | -1) => {
    setActiveIndex((current) => {
      if (items.length === 0) return 0;
      return (current + direction + items.length) % items.length;
    });
  }, [items.length]);

  useEffect(() => {
    const shouldRotate = items.length > 1 && !isPaused && !isHovered && !isFocused && !prefersReducedMotion;
    if (!shouldRotate) return undefined;
    const intervalId = window.setInterval(() => move(1), 7_000);
    return () => window.clearInterval(intervalId);
  }, [isFocused, isHovered, isPaused, items.length, move, prefersReducedMotion]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (items.length < 2) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(items.length - 1);
    }
  }

  const current = items[activeIndex];
  const placementLabel = placement === "homepage" ? "Homepage stories" : "Client stories";

  return (
    <section className={`${styles.section} ${styles[variant]}`} aria-labelledby={headingId}>
      <div className={styles.shell}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>{placementLabel}</p>
            <h2 id={headingId}>{heading}</h2>
          </div>
          <p>{description}</p>
        </div>

        {isLoading ? (
          <div className={styles.empty} role="status">Loading approved stories…</div>
        ) : error ? (
          <div className={styles.empty} role="status">
            <strong>Stories are temporarily unavailable.</strong>
            <span>There is no change to your enquiry or booking flow.</span>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.empty} role="status">
            <strong>Approved client reflections will appear here.</strong>
            <span>Stories are published only after the client has given permission.</span>
          </div>
        ) : (
          <div
            className={styles.carousel}
            role="region"
            aria-roledescription="carousel"
            aria-label={`${placementLabel} carousel`}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false);
            }}
          >
            <div className={styles.stage}>
              <figure className={styles.media}>
                {/* Testimonial image URLs are selected by an admin and may be hosted on S3 or a CDN. */}
                <img
                  src={current.imageUrl}
                  alt={current.altText}
                  loading={activeIndex === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </figure>
              <div className={styles.copy}>
                <p className={styles.slideNumber} aria-live="polite">{String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</p>
                <h3>{current.title}</h3>
                <p className={styles.permission}>Shared with permission. Individual experiences are not promised outcomes.</p>
                <div className={styles.controls}>
                  <button type="button" onClick={() => move(-1)} aria-label="Previous testimonial" disabled={items.length < 2}><span aria-hidden="true">←</span><span>Previous</span></button>
                  <button type="button" onClick={() => move(1)} aria-label="Next testimonial" disabled={items.length < 2}><span>Next</span><span aria-hidden="true">→</span></button>
                  {items.length > 1 ? <button type="button" className={styles.pause} aria-pressed={isPaused} onClick={() => setIsPaused((currentPaused) => !currentPaused)}>{isPaused ? "Play stories" : "Pause stories"}</button> : null}
                </div>
              </div>
            </div>
            <p className={styles.srOnly} aria-live="polite">Showing testimonial {activeIndex + 1} of {items.length}: {current.title}</p>
          </div>
        )}

        {variant === "homepage" ? <Link className={styles.link} href="/testimonials">Explore client stories <span aria-hidden="true">↗</span></Link> : null}
      </div>
    </section>
  );
}
