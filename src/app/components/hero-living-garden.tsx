"use client";

import Image from "next/image";
import { useState } from "react";
import HeroGardenScene from "./hero-garden-scene";
import { gardenStories } from "./hero-garden-data";
import s from "./hero-living-garden.module.css";

export default function HeroLivingGarden() {
  const [paused, setPaused] = useState(false);
  const story = gardenStories[0];
  return <div className={s.garden} data-hero-garden data-paused={paused} data-story={0}>
    <div className={s.picture}>
      <Image className={s.fallback} src={story.src} alt={story.alt} fill priority sizes="100vw" />
      <HeroGardenScene active={0} paused={paused} />
    </div>
    <div className={s.shade} aria-hidden="true" />
    <div className={s.caption}><span>THE EVERYDAY PRACTICE / 01</span><p>Good food.<br /><em>Your kind of balance.</em></p></div>
    <button className={s.pause} onClick={() => setPaused(value => !value)} aria-label={paused ? "Play garden animation" : "Pause garden animation"} aria-pressed={paused}><span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span><small>{paused ? "Play motion" : "Pause motion"}</small></button>
  </div>;
}
