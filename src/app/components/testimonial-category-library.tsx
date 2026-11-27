"use client";

import { useId, useState } from "react";
import TestimonialCarousel from "./testimonial-carousel";
import {
  testimonialCategoryLabel,
  testimonialCategoryOptions,
  type TestimonialCategory,
  type TestimonialPlacement,
} from "./testimonial-data";
import styles from "./testimonial-category-library.module.css";

const publicTestimonialPlacements: readonly TestimonialPlacement[] = ["testimonials"];

export default function TestimonialCategoryLibrary() {
  const tabListId = useId();
  const panelId = `${tabListId}-panel`;
  const [category, setCategory] = useState<TestimonialCategory | undefined>();

  return (
    <div className={styles.library}>
      <div className={styles.shell}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>BROWSE BY STARTING POINT</p>
          <h2>Find the stories closest to your question.</h2>
          <p>Choose a focus area to read approved reflections from people who began with a similar concern.</p>
        </div>
        <div className={styles.tabs} role="group" aria-label="Filter client stories by focus area" id={tabListId}>
          <button
            type="button"
            aria-pressed={!category}
            aria-controls={panelId}
            onClick={() => setCategory(undefined)}
          >
            All stories
          </button>
          {testimonialCategoryOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={category === option.value}
              aria-controls={panelId}
              onClick={() => setCategory(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div id={panelId} role="region" aria-live="polite" aria-label={category ? `${testimonialCategoryLabel(category)} client stories` : "All client stories"}>
        <TestimonialCarousel
          key={category ?? "all"}
          placement="slides"
          additionalPlacements={publicTestimonialPlacements}
          category={category}
          variant="page"
          showAllCategories
          heading={category ? `${testimonialCategoryLabel(category)} stories, in their own words.` : "Approved stories, in their own words."}
          description={category ? `Permission-approved reflections from the ${testimonialCategoryLabel(category)} focus area.` : "The collection below is managed by the practice team. Each image is published only after the client has given permission for it to be shared."}
        />
      </div>
    </div>
  );
}
