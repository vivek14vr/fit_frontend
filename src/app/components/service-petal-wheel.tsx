"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import PetalFlowerScene from "./petal-flower-scene";
import { wheelPaths } from "./service-wheel-data";
import s from "../homepage.module.css";
import n from "./service-navigation.module.css";

// The unchanged petal path from the approved header logo.
const logoPetal = "M0 -26 C14 -34 18 -50 0 -66 C-18 -50 -14 -34 0 -26 Z";

export default function ServicePetalWheel() {
  const [current, setCurrent] = useState(0);
  const item = wheelPaths[current];
  const select = (event: MouseEvent, index: number) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setCurrent(index);
  };
  return (
    <nav className={n.navigation} aria-label="Explore Deepti’s services" style={{ "--path-color": item.color } as CSSProperties}>
      <div className={n.flowerColumn}>
      <div className={`${s.logoWheel} ${n.wheel}`} data-discovery-flower>
        <PetalFlowerScene active={current} />
        <svg className={s.logoWheelArtwork} viewBox="0 0 200 200" role="group" aria-label="Interactive Deepa Chakra">
          <circle className={s.logoWheelRim} cx="100" cy="100" r="84" />
          {wheelPaths.map((item, index) => (
            <a key={item.title} href={item.href} role="button" aria-pressed={current === index} aria-label={`Preview ${item.title}`} data-petal-index={index}
              onClick={event => select(event, index)} onKeyDown={event => { if (event.key === " ") { event.preventDefault(); setCurrent(index); } }} className={s.logoPetalLink}
              style={{ "--petal-color": item.color } as CSSProperties} data-active={current === index}>
              <title>{item.title}</title>
              <g transform={`translate(100 100) rotate(${index * 60})`}>
                <path className={s.logoPetalFill} d={logoPetal} />
                <path className={s.logoPetalHit} d={logoPetal} />
                <text transform={`translate(0 -47) rotate(${-index * 60})`} textAnchor="middle" dominantBaseline="central" className={s.logoPetalNumber}>{index + 1}</text>
              </g>
            </a>
          ))}
          <g className={s.logoFlame} aria-hidden="true">
            <path d="M100 76 C110 87 111 99 100 108 C89 99 90 87 100 76 Z" fill="#C9922E" />
            <path d="M78 114 C90 126 110 126 122 114 C110 118 90 118 78 114 Z" fill="#3F6B55" stroke="#3F6B55" strokeWidth="3" strokeLinejoin="round" />
          </g>
        </svg>
      </div>
      <p className={n.flowerHint}>Six ways in. <em>One personal approach.</em></p>
      </div>
      <div className={n.pathColumn}>
        <div className={n.preview}>
          <div key={current} className={n.previewContent} aria-live="polite" aria-atomic="true">
            <p className={n.eyebrow}>{current < 4 ? "YOUR NUTRITION PATH" : "A PLACE TO BEGIN"} <span>0{current + 1} / 06</span></p>
            <h3>{item.title}</h3>
            <p className={n.description}>{item.description}</p>
            <p className={n.detail}>{item.detail}</p>
          </div>
          <a className={n.explore} href={item.href}> {current === 4 ? "Book a conversation" : `Explore ${item.title}`} <span aria-hidden="true">↗</span></a>
        </div>
        <div className={n.choices} role="group" aria-label="Choose a nutrition programme">
          <p className={n.groupLabel}>PROGRAMMES</p>
          {wheelPaths.slice(0,4).map((path,index) => <button type="button" key={path.title} aria-pressed={current === index} onClick={() => setCurrent(index)} style={{ "--petal-color": path.color } as CSSProperties}><span>{index + 1}</span>{path.title}</button>)}
        </div>
        <div className={n.choices} role="group" aria-label="Other ways to begin">
          <p className={n.groupLabel}>START WITH THE BIGGER PICTURE</p>
          {wheelPaths.slice(4).map((path,index) => <button type="button" key={path.title} aria-pressed={current === index + 4} onClick={() => setCurrent(index + 4)} style={{ "--petal-color": path.color } as CSSProperties}><span>{index + 5}</span>{path.title}</button>)}
        </div>
      </div>
    </nav>
  );
}
