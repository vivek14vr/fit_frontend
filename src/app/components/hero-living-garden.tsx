"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gardenStories } from "./hero-garden-data";
import s from "./hero-living-garden.module.css";

export default function HeroLivingGarden() {
  const [paused, setPaused] = useState(false);
  const gardenRef = useRef<HTMLDivElement>(null);
  const story = gardenStories[0];

  useEffect(() => {
    const garden = gardenRef.current;
    if (!garden) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    garden.dataset.saveData = String(Boolean(connection?.saveData));
    let visible = true;
    const sync = () => { garden.dataset.motionVisible = String(visible && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(garden);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, []);

  return <div ref={gardenRef} className={s.garden} data-hero-garden data-paused={paused} data-story={0}>
    <div className={s.picture}>
      <Image className={s.fallback} src={story.src} alt={story.alt} fill priority sizes="100vw" />
    </div>
    <div className={s.shade} aria-hidden="true" />
    <div className={s.caption}><span>THE EVERYDAY PRACTICE / 01</span><p>Good food.<br /><em>Your kind of balance.</em></p></div>
    <button className={s.pause} onClick={() => setPaused(value => !value)} aria-label={paused ? "Play garden animation" : "Pause garden animation"} aria-pressed={paused}><span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span><small>{paused ? "Play motion" : "Pause motion"}</small></button>
  </div>;
}
