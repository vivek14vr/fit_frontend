"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { apiUrl } from "@/app/lib/auth-client";
import { useModalAccessibility } from "./use-modal-accessibility";
import {
  testimonialCategoryLabel,
  testimonialCategoryOptions,
  type TestimonialCategory,
  type TestimonialPlacement,
} from "./testimonial-data";
import styles from "./testimonial-carousel.module.css";

export type { TestimonialCategory, TestimonialPlacement } from "./testimonial-data";
export type TestimonialVariant = "homepage" | "page" | "slide";

const MAX_GALLERY_ITEMS = 4;

type Testimonial = {
  id: string;
  title: string;
  altText: string;
  imageUrl: string;
  placements: TestimonialPlacement[];
  categories: TestimonialCategory[];
  status: "published";
  sortOrder: number;
  createdAt?: string | null;
};

type TestimonialCarouselProps = {
  id?: string;
  placement: TestimonialPlacement;
  additionalPlacements?: readonly TestimonialPlacement[];
  category?: TestimonialCategory;
  variant?: TestimonialVariant;
  heading?: string;
  description?: string;
  hideWhenEmpty?: boolean;
  maxItems?: number;
  showCategoryFilters?: boolean;
  showAllCategories?: boolean;
};

type Preview = {
  item: Testimonial;
  status: "ready" | "refreshing" | "retried" | "unavailable";
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

function uniqueTestimonials(items: Testimonial[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function TestimonialCarousel({
  id,
  placement,
  additionalPlacements = [],
  category,
  variant = "page",
  heading = "Real experiences, shared with care.",
  description = "A small collection of client reflections, published with permission and without promising the same outcome for everyone.",
  hideWhenEmpty = false,
  maxItems = MAX_GALLERY_ITEMS,
  showCategoryFilters = false,
  showAllCategories = false,
}: TestimonialCarouselProps) {
  const headingId = useId();
  const previewTitleId = useId();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<TestimonialCategory | undefined>(category);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [partialError, setPartialError] = useState("");
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(() => new Set());
  const imageRefreshAttempted = useRef(false);
  const imageRetryKey = useRef("");
  const previewModalRef = useModalAccessibility(Boolean(preview), () => setPreview(null));
  const previewCloseRef = useRef<HTMLButtonElement>(null);

  const itemLimit = Math.min(Math.max(maxItems, 1), MAX_GALLERY_ITEMS);
  const placementQuery = Array.from(new Set([placement, ...additionalPlacements])).join(",");
  const loadAllCategories = !category && variant !== "slide";
  const imageSourceKey = `${placementQuery}|${category ?? ""}|${variant}`;

  useEffect(() => {
    if (imageRetryKey.current !== imageSourceKey) {
      imageRetryKey.current = imageSourceKey;
      imageRefreshAttempted.current = false;
    }
    const controller = new AbortController();
    let isActive = true;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 8_000);
    const requestCategories: Array<TestimonialCategory | "general" | undefined> = loadAllCategories
      ? ["general", ...testimonialCategoryOptions.map((option) => option.value)]
      : [category];

    async function loadOne(requestPlacement: string, requestCategory: typeof requestCategories[number]) {
      const query = new URLSearchParams({
        placement: requestPlacement,
        limit: String(itemLimit),
      });
      if (requestCategory) query.set("category", requestCategory);

      const request = () => fetch(
        apiUrl + "/testimonials?" + query.toString(),
        { signal: controller.signal, cache: "no-store" },
      );
      let response = await request();
      if (requestCategory === "general" && response.status === 400) {
        // Older servers only accept named programme categories.
        query.delete("category");
        query.delete("limit");
        response = await request();
      }
      if (!response.ok) throw new Error("Unable to load testimonials.");
      const body = (await response.json().catch(() => null)) as { testimonials?: unknown } | null;
      if (!Array.isArray(body?.testimonials)) throw new Error("Invalid testimonial response.");
      const stories = body.testimonials.filter(isTestimonial);
      return requestCategory === "general"
        ? stories.filter((story) => !story.categories?.length).slice(0, itemLimit)
        : stories.slice(0, itemLimit);
    }

    async function loadTestimonials() {
      try {
        // A single placement per request is compatible with both API versions.
        const results = await Promise.allSettled(
          placementQuery.split(",").flatMap((requestedPlacement) =>
            requestCategories.map((requestedCategory) => loadOne(requestedPlacement, requestedCategory)),
          ),
        );

        const successful = results.filter(
          (result): result is PromiseFulfilledResult<Testimonial[]> => result.status === "fulfilled",
        );
        const nextItems = uniqueTestimonials(successful.flatMap((result) => result.value))
          .sort((a, b) => a.sortOrder - b.sortOrder || (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        const failedCount = results.length - successful.length;
        if (failedCount > 0 && nextItems.length === 0) {
          const failed = results.find((result) => result.status === "rejected");
          throw failed?.status === "rejected" && failed.reason instanceof Error
            ? failed.reason
            : new Error("Unable to load testimonials.");
        }

        if (isActive) {
          setItems(nextItems);
          setPreview((current) => {
            if (current?.status !== "refreshing") return current;
            const refreshed = nextItems.find((item) => item.id === current.item.id);
            return refreshed
              ? { item: refreshed, status: "retried" }
              : { ...current, status: "unavailable" };
          });
          setPartialError(
            failedCount > 0
              ? "Some stories could not be loaded. You can try again to complete the gallery."
              : "",
          );
        }
      } catch (requestError) {
        if (!isActive) return;
        setPreview((current) => current?.status === "refreshing"
          ? { ...current, status: "unavailable" }
          : current);
        const message = requestError instanceof TypeError
          ? "The stories service is not reachable right now. Please try again shortly."
          : requestError instanceof Error
            ? requestError.message
            : "Unable to load testimonials.";
        setError(
          timedOut
            ? "Stories are taking too long to load. Please try again."
            : message,
        );
        setPartialError("");
      } finally {
        window.clearTimeout(timeoutId);
        if (isActive) setIsLoading(false);
      }
    }

    const startId = window.setTimeout(() => {
      if (!isActive) return;
      setIsLoading(true);
      setError("");
      setPartialError("");
      setFailedImageIds(new Set());
      setActiveIndex(0);
      void loadTestimonials();
    }, 0);
    return () => {
      isActive = false;
      controller.abort();
      window.clearTimeout(timeoutId);
      window.clearTimeout(startId);
    };
  }, [category, imageSourceKey, itemLimit, loadAllCategories, placementQuery, reloadToken, variant]);

  const activeCategory = category ?? selectedCategory;
  const filteredItems = activeCategory
    ? items.filter((item) => Array.isArray(item.categories) && item.categories.includes(activeCategory))
    : items;
  const galleryItems = filteredItems.slice(0, itemLimit);
  const hasTestimonialsPlacement = additionalPlacements.includes("testimonials");
  const placementLabel = activeCategory
    ? testimonialCategoryLabel(activeCategory) + " stories"
    : hasTestimonialsPlacement
      ? "Client stories"
      : placement === "slides"
        ? "Programme stories"
        : placement === "homepage"
          ? "Homepage stories"
          : "Client stories";
  const showAllCategoryGallery = showAllCategories && !activeCategory && variant !== "slide";
  const galleryGroups = showAllCategoryGallery
    ? [
        ...testimonialCategoryOptions.map((option) => ({
          key: option.value,
          label: option.label,
          category: option.value,
          items: items
            .filter((item) => Array.isArray(item.categories) && item.categories.includes(option.value))
            .slice(0, itemLimit),
        })),
        {
          key: "general",
          label: "General stories",
          category: undefined,
          items: items.filter((item) => !item.categories?.length).slice(0, itemLimit),
        },
      ].filter((group) => group.items.length > 0)
    : [{
        key: activeCategory ?? "all",
        label: activeCategory ? testimonialCategoryLabel(activeCategory) : "Client stories",
        category: activeCategory,
        items: galleryItems,
      }];
  const hasVisibleStories = variant === "slide"
    ? items.length > 0
    : galleryGroups.some((group) => group.items.length > 0);
  const loadingGroups = showAllCategoryGallery
    ? [...testimonialCategoryOptions, { value: "general", label: "General stories" }]
    : [{ value: "all", label: "Approved stories" }];

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

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
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

  const current = items[activeIndex] ?? items[0];

  const handleImageError = useCallback((id: string) => {
    if (!imageRefreshAttempted.current) {
      imageRefreshAttempted.current = true;
      setReloadToken((token) => token + 1);
      return;
    }

    setFailedImageIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(id);
      return nextIds;
    });
  }, []);

  const retryStories = useCallback(() => {
    imageRefreshAttempted.current = false;
    setReloadToken((token) => token + 1);
  }, []);

  function refreshPreview(item: Testimonial) {
    imageRefreshAttempted.current = true;
    setPreview({ item, status: "refreshing" });
    setReloadToken((token) => token + 1);
  }

  if (hideWhenEmpty && !isLoading && !error && !hasVisibleStories && !preview) return null;

  return (
    <section id={id} className={styles.section + " " + styles[variant]} aria-labelledby={headingId} aria-busy={isLoading && !preview}>
      <div className={styles.shell}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>{placementLabel}</p>
            <h2 id={headingId}>{heading}</h2>
          </div>
          <p>{description}</p>
        </div>

        {showCategoryFilters ? (
          <div className={styles.filters} role="group" aria-label="Filter programme stories by focus area">
            <button type="button" aria-pressed={!selectedCategory} onClick={() => setSelectedCategory(undefined)}>All stories</button>
            {testimonialCategoryOptions.map((option) => (
              <button key={option.value} type="button" aria-pressed={selectedCategory === option.value} onClick={() => setSelectedCategory(option.value)}>
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {partialError || (error && hasVisibleStories) ? (
          <div className={styles.partialNotice} role="status">
            <span>{partialError || error}</span>
            <button type="button" onClick={retryStories}>Retry gallery</button>
          </div>
        ) : null}

        {isLoading && !hasVisibleStories ? (
          <div className={styles.galleryCollection} role="status" aria-label="Loading approved stories">
            <span className={styles.srOnly}>Loading approved stories…</span>
            {loadingGroups.map((group) => (
              <div className={styles.galleryGroup} key={group.value}>
                {showAllCategoryGallery ? (
                  <div className={styles.galleryGroupHeading}>
                    <p className={styles.eyebrow}>FOCUS AREA</p>
                    <h3>{group.label}</h3>
                  </div>
                ) : null}
                <div className={styles.gallery + " " + styles.loadingGallery} aria-hidden="true">
                  {Array.from({ length: itemLimit }, (_, index) => (
                    <div className={styles.skeletonCard} key={index}>
                      <div className={styles.skeletonMedia} />
                      <div className={styles.skeletonLine} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error && !hasVisibleStories ? (
          <div className={styles.empty} role="status">
            <strong>Stories are temporarily unavailable.</strong>
            <span>{error}</span>
            <button type="button" className={styles.retry} onClick={retryStories}>Try again</button>
          </div>
        ) : !hasVisibleStories ? (
          <div className={styles.empty} role="status">
            <strong>Approved client reflections will appear here.</strong>
            <span>Stories are published only after the client has given permission.</span>
          </div>
        ) : variant !== "slide" ? (
          <div className={styles.galleryCollection}>
            {galleryGroups.map((group) => (
              <div className={styles.galleryGroup} key={group.key}>
                {showAllCategoryGallery ? (
                  <div className={styles.galleryGroupHeading}>
                    <p className={styles.eyebrow}>FOCUS AREA</p>
                    <h3>{group.label}</h3>
                  </div>
                ) : null}
                <div className={styles.gallery} role="list" aria-label={group.label + " gallery"}>
                  {group.items.map((item, index) => {
                    const itemCategory = activeCategory ?? group.category ?? item.categories?.[0];
                    return (
                      <figure className={styles.galleryCard} key={item.id} role="listitem">
                        <button
                          type="button"
                          className={styles.galleryButton}
                          onClick={() => setPreview({ item, status: "ready" })}
                          disabled={failedImageIds.has(item.id)}
                          aria-label={failedImageIds.has(item.id) ? `${item.title} image unavailable` : "Preview " + item.title}
                        >
                          {failedImageIds.has(item.id) ? (
                            <span className={styles.imageFallback}>Image preview unavailable</span>
                          ) : (
                            <img src={item.imageUrl} alt={item.altText} loading={!showAllCategoryGallery && index === 0 ? "eager" : "lazy"} decoding="async" onError={() => handleImageError(item.id)} />
                          )}
                          {!failedImageIds.has(item.id) ? <span className={styles.previewHint}>Preview <span aria-hidden="true">↗</span></span> : null}
                        </button>
                        <figcaption>
                          <span>{itemCategory ? testimonialCategoryLabel(itemCategory) : "Client story"}</span>
                          <strong>{item.title}</strong>
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={styles.carousel}
            role="region"
            aria-roledescription="carousel"
            aria-label={placementLabel + " carousel"}
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
                {failedImageIds.has(current.id) ? (
                  <span className={styles.imageFallback}>Image preview unavailable</span>
                ) : (
                  <img
                    src={current.imageUrl}
                    alt={current.altText}
                    loading={activeIndex === 0 ? "eager" : "lazy"}
                    decoding="async"
                    onError={() => handleImageError(current.id)}
                  />
                )}
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

      {preview ? (
        <div
          className={styles.lightboxBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setPreview(null);
          }}
        >
          <section ref={previewModalRef} className={styles.lightbox} role="dialog" aria-modal="true" aria-labelledby={previewTitleId}>
            <div className={styles.lightboxHeader}>
              <div>
                <p className={styles.eyebrow}>CLIENT STORY PREVIEW</p>
                <h2 id={previewTitleId}>{preview.item.title}</h2>
              </div>
              <button ref={previewCloseRef} type="button" className={styles.lightboxClose} onClick={() => setPreview(null)} aria-label="Close image preview">
                Close <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className={styles.lightboxMedia}>
              {preview.status === "refreshing" ? (
                <p role="status">Reloading image…</p>
              ) : preview.status === "unavailable" ? (
                <div className={styles.previewError}>
                  <p role="status">Image preview unavailable.</p>
                  <button type="button" className={styles.lightboxClose} onClick={() => {
                    previewCloseRef.current?.focus();
                    refreshPreview(preview.item);
                  }}>Try again</button>
                </div>
              ) : (
                <img src={preview.item.imageUrl} alt={preview.item.altText} decoding="async" onError={() => {
                  if (preview.status === "ready") refreshPreview(preview.item);
                  else setPreview({ ...preview, status: "unavailable" });
                }} />
              )}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
