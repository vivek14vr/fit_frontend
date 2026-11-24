"use client";

import { useState, type CSSProperties } from "react";
import s from "./body-concerns.module.css";

export const BODY_CONCERNS = [
  {
    id: "mind-emotional-wellness",
    number: "01",
    title: "Mind & emotional wellness",
    shortTitle: "Mind & emotions",
    description: "Explore how stress, sleep, emotional eating and everyday routines may shape the way you feel and eat.",
    position: { x: 50, y: 19 },
  },
  {
    id: "thyroid",
    number: "02",
    title: "Thyroid nutrition support",
    shortTitle: "Thyroid",
    description: "Bring your nutrition goals, food patterns and medical guidance into one considered conversation.",
    position: { x: 50, y: 28 },
  },
  {
    id: "liver",
    number: "03",
    title: "Liver health",
    shortTitle: "Liver",
    description: "Look at everyday food and lifestyle choices that can support your liver-health goals alongside medical care.",
    position: { x: 44, y: 41 },
  },
  {
    id: "gut",
    number: "04",
    title: "Gut & digestion",
    shortTitle: "Gut",
    description: "Understand digestion, food patterns and the daily rhythms connected with comfort and consistency.",
    position: { x: 50, y: 50 },
  },
  {
    id: "fat-loss-metabolic",
    number: "05",
    title: "Fat loss & metabolic health",
    shortTitle: "Fat loss",
    description: "Move beyond the scale with sustainable habits shaped around your routines, markers and long-term goals.",
    position: { x: 50, y: 59 },
  },
  {
    id: "skin",
    number: "06",
    title: "Skin health",
    shortTitle: "Skin",
    description: "Explore the relationship between nourishment, everyday habits and your individual skin-health goals.",
    position: { x: 67, y: 34 },
  },
] as const;

export type BodyConcernId = (typeof BODY_CONCERNS)[number]["id"];

type BodyConcernsProps = {
  onStartConversation: (concern?: BodyConcernId) => void;
};

export default function BodyConcerns({ onStartConversation }: BodyConcernsProps) {
  const [activeId, setActiveId] = useState<BodyConcernId>("gut");
  const active = BODY_CONCERNS.find((concern) => concern.id === activeId) ?? BODY_CONCERNS[3];

  return (
    <section className={s.section} id="body-goals" aria-labelledby="body-goals-title" data-transition-section="body-goals">
      <div className={s.shell}>
        <header className={s.heading} data-home-reveal data-reveal="up">
          <div>
            <p className={s.eyebrow}>THE WHOLE BODY, IN VIEW</p>
            <h2 id="body-goals-title">Where would you like<br /><em>to feel supported?</em></h2>
          </div>
          <p>
            Your concerns rarely exist in isolation. Explore the areas that are on your mind, then share your goals in a private conversation starter.
          </p>
        </header>

        <div className={s.explorer}>
          <div className={s.concernList} aria-label="Health goal areas">
            <p className={s.panelLabel}>SELECT A FOCUS</p>
            {BODY_CONCERNS.map((concern) => (
              <button
                key={concern.id}
                type="button"
                className={s.concernButton}
                data-active={activeId === concern.id}
                aria-pressed={activeId === concern.id}
                onClick={() => setActiveId(concern.id)}
              >
                <span>{concern.number}</span>
                <strong>{concern.shortTitle}</strong>
                <small aria-hidden="true">↗</small>
              </button>
            ))}
          </div>

          <div className={s.bodyStage} data-home-reveal data-reveal="scale">
            <div className={s.stageMeta} aria-hidden="true"><span>INTERACTIVE HEALTH MAP</span><span>{active.number} / 06</span></div>
            <svg className={s.bodyArtwork} viewBox="0 0 360 620" role="img" aria-labelledby="body-map-title body-map-description">
              <title id="body-map-title">Interactive whole-body health goal map</title>
              <desc id="body-map-description">A human body illustration showing the mind, thyroid, liver, gut, metabolic and skin areas.</desc>
              <defs>
                <linearGradient id="body-surface" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#d9e6da" stopOpacity=".13" />
                  <stop offset="1" stopColor="#79a493" stopOpacity=".04" />
                </linearGradient>
              </defs>

              <g className={s.bodySilhouette} data-active={activeId === "skin"}>
                <ellipse cx="180" cy="66" rx="34" ry="43" />
                <path d="M164 105c1 12-2 20-11 27l27 18 27-18c-9-7-12-15-11-27-9 5-23 5-32 0Z" />
                <path d="M153 126c-17 4-31 14-39 30-10 21-12 58-8 92 3 31 11 62 22 86 8 18 17 29 26 34 16 9 36 9 52 0 9-5 18-16 26-34 11-24 19-55 22-86 4-34 2-71-8-92-8-16-22-26-39-30-10 17-44 17-54 0Z" />
                <path d="M119 151c-19 9-28 23-33 44L55 333c-4 18 6 32 21 35 14 3 27-6 31-22l31-126 5-61c-7-7-15-10-24-8Z" />
                <path d="M241 151c19 9 28 23 33 44l31 138c4 18-6 32-21 35-14 3-27-6-31-22l-31-126-5-61c7-7 15-10 24-8Z" />
                <path d="M151 354c-4 33-4 69-1 101l-11 112c-2 19 7 33 22 35 16 2 27-9 29-28l-10-114-1-95c-10-1-20-5-28-11Z" />
                <path d="M209 354c4 33 4 69 1 101l11 112c2 19-7 33-22 35-16 2-27-9-29-28l10-114 1-95c10-1 20-5 28-11Z" />
              </g>

              <g className={s.anatomyLines} aria-hidden="true">
                <path d="M155 158c16 10 34 10 50 0" />
                <path d="M180 150v210" />
                <path d="M138 190c25-18 59-18 84 0M130 218c30-18 70-18 100 0" />
                <path d="M146 352c22 9 46 9 68 0" />
              </g>

              <g className={s.mindRegion} data-active={activeId === "mind-emotional-wellness"}>
                <path d="M158 61c-5-12 5-23 17-20 8-9 24-4 24 8 10 4 10 19 1 24-1 12-16 17-24 9-10 5-22-4-18-15-4-1-5-4-4-6Z" />
                <path className={s.regionDetail} d="M176 44c-5 7 4 11 0 18m14-15c-7 5-1 10-6 16m-20-4c8 1 8 8 14 9m8-4c4 4 9 4 12 2" />
              </g>
              <g className={s.thyroidRegion} data-active={activeId === "thyroid"}>
                <path d="M163 126c6-7 13-4 17 3 4-7 11-10 17-3 6 7 1 18-8 19-4 1-7-1-9-4-2 3-5 5-9 4-9-1-14-12-8-19Z" />
              </g>
              <g className={s.liverRegion} data-active={activeId === "liver"}>
                <path d="M132 216c17-15 55-17 88-5 10 4 14 13 9 23-8 14-28 20-51 15-18-4-31-2-43 4-7-11-8-26-3-37Z" />
                <path className={s.regionDetail} d="M180 216c-3 13-1 24 5 33" />
              </g>
              <g className={s.gutRegion} data-active={activeId === "gut"}>
                <path className={s.gutOutline} d="M154 269h52c8 0 14 6 14 14v35c0 8-6 14-14 14h-52c-8 0-14-6-14-14v-35c0-8 6-14 14-14Z" />
                <path className={s.regionDetail} d="M158 283c9-7 25-4 25 5 0 10-25 6-25 17 0 10 22 6 30 14m-8-47c-4 8 2 13 9 17 9 6 7 14-2 19m20-26c-7 7-7 14 0 21" />
              </g>
              <g className={s.metabolicRegion} data-active={activeId === "fat-loss-metabolic"}>
                <path d="M139 326c24 12 58 12 82 0l-5 32c-22 10-50 10-72 0Z" />
                <path className={s.regionDetail} d="M151 342h58" />
              </g>
            </svg>

            {BODY_CONCERNS.map((concern) => (
              <button
                key={concern.id}
                type="button"
                className={s.mapMarker}
                data-active={activeId === concern.id}
                style={{ "--marker-x": `${concern.position.x}%`, "--marker-y": `${concern.position.y}%` } as CSSProperties}
                aria-label={`Show ${concern.title}`}
                aria-pressed={activeId === concern.id}
                onClick={() => setActiveId(concern.id)}
              >
                <span aria-hidden="true" />
                <small aria-hidden="true">{concern.shortTitle}</small>
              </button>
            ))}
          </div>

          <article className={s.detail} aria-live="polite" aria-atomic="true" data-home-reveal data-reveal="right">
            <div className={s.detailTopline}><p className={s.detailNumber}>{active.number} / 06</p><span>SELECTED FOCUS</span></div>
            <h3>{active.title}</h3>
            <p>{active.description}</p>
            <button type="button" onClick={() => onStartConversation(active.id)}>
              Tell us about your goals <span aria-hidden="true">↗</span>
            </button>
            <small>Nutrition guidance supports—not replaces—medical or mental-health care.</small>
          </article>
        </div>
      </div>
    </section>
  );
}
