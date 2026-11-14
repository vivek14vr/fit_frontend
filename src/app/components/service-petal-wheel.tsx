"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import Image from "next/image";
import PetalFlowerScene from "./petal-flower-scene";
import { wheelPaths } from "./service-wheel-data";
import s from "../homepage.module.css";
import n from "./service-navigation.module.css";

const petal = "M0 -22 C30 -34 34 -62 0 -85 C-34 -62 -30 -34 0 -22 Z";


export default function ServicePetalWheel() {
  const experience = useRef<HTMLDivElement>(null);
  const manual = useRef(false);
  const [position, setPosition] = useState({ index: 1, angle: 0, zoom: 0, scrolling: false });
  const [visual, setVisual] = useState({ angle: 0, zoom: 0 });
  const visualRef = useRef(visual);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let previous = performance.now();
    const animate = (now: number) => {
      const amount = reduced ? 1 : 1 - Math.exp(-Math.min(now - previous, 64) / 145);
      previous = now;
      const old = visualRef.current;
      const angle = old.angle + (position.angle - old.angle) * amount;
      const zoom = old.zoom + (position.zoom - old.zoom) * amount;
      const settled = Math.abs(angle - position.angle) < .02 && Math.abs(zoom - position.zoom) < .0001;
      visualRef.current = settled ? { angle: position.angle, zoom: position.zoom } : { angle, zoom };
      setVisual(visualRef.current);
      if (!settled) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [position.angle, position.zoom]);
  const current = position.index;
  const item = wheelPaths[current];
  useEffect(() => {
    const host = experience.current;
    if (!host) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      if (manual.current || motion.matches) return;
      const rect = host.getBoundingClientRect();
      const nav = host.firstElementChild as HTMLElement;
      const start = innerWidth > 600 ? 110 : 86;
      const distance = Math.max(1, host.offsetHeight - nav.offsetHeight);
      const progress = Math.max(0, Math.min(1, (start - rect.top) / distance));
      const ease = (value: number) => value*value*(3-2*value);
      const zoom = ease(Math.min(1,progress/.22));
      const journey = Math.max(0,(progress-.22)/.78)*5;
      const chapter = Math.floor(journey);
      const turn = chapter + ease(Math.max(0,(journey-chapter-.65)/.35));
      const angle = zoom * 30 - Math.min(5,turn)*60;
      setPosition(old => Math.abs(old.angle-angle)<.05 && Math.abs(old.zoom-zoom)<.002 ? old : { index: (Math.round(Math.min(5,turn)) + 1) % 6, angle, zoom, scrolling:true });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const scroll = () => { schedule(); };
    const resume = () => { manual.current = false; schedule(); };
    const keyScroll = (event: KeyboardEvent) => {
      if (["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"].includes(event.key)) resume();
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(host);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("wheel",resume,{passive:true});
    window.addEventListener("touchmove",resume,{passive:true});
    window.addEventListener("keydown",keyScroll);
    motion.addEventListener("change", schedule);
    schedule();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); window.removeEventListener("scroll",scroll); window.removeEventListener("resize",schedule); motion.removeEventListener("change",schedule); window.removeEventListener("wheel",resume); window.removeEventListener("touchmove",resume); window.removeEventListener("keydown",keyScroll); };
  }, []);
  const choose = (index: number) => {
    manual.current = true;
    setPosition(old => {
      const target = 90-index*60;
      return { index, angle: target + Math.round((old.angle-target)/360)*360, zoom: 1, scrolling: false };
    });
  };
  const select = (event: MouseEvent, index: number) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); choose(index);
  };
  return <div ref={experience} className={n.experience} data-flower-experience>
    <nav className={n.navigation} aria-label="Explore Deepti’s services" data-scrolling={position.scrolling} data-expanded={visual.zoom>.85} style={{ "--path-color": item.color, "--wheel-angle": `${visual.angle}deg`, "--flower-zoom": visual.zoom } as CSSProperties}>
      <div className={n.flowerColumn}>
        <div className={n.wheelTop}><span>{position.zoom>.65?"ONE PATH AT A TIME":"SIX WAYS TO BEGIN"}</span><span>0{current+1} / 06</span></div>
        <div className={n.flowerFrame}><div className={`${s.logoWheel} ${n.wheel}`} data-discovery-flower>
          <svg className={n.orbit} viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" /><path d="M198 97 L194 100 L198 103" /></svg>
          <div className={n.rotor} data-flower-rotor>
            <PetalFlowerScene active={current} />
            <svg className={s.logoWheelArtwork} viewBox="0 0 200 200" role="group" aria-label="Interactive Deepa Chakra">
              {wheelPaths.map((path,index) => <a key={path.title} href={path.href} role="button" aria-pressed={current===index} aria-label={`Preview ${path.title}`} data-petal-index={index} tabIndex={position.zoom>.65 && current!==index?-1:0} onClick={event=>select(event,index)} onKeyDown={event=>{
                if(event.key===" "){event.preventDefault();choose(index);}
                if(event.key==="ArrowRight"||event.key==="ArrowLeft"){event.preventDefault();const next=(current+(event.key==="ArrowRight"?1:5))%6;choose(next);event.currentTarget.parentElement?.querySelector<SVGAElement>(`[data-petal-index="${next}"]`)?.focus();}
              }} className={`${s.logoPetalLink} ${n.petalLink}`} style={{"--petal-color":path.color,"--petal-angle":`${index*60}deg`} as CSSProperties} data-active={current===index}>
                <title>{path.title}</title>
                <g transform={`translate(100 100) rotate(${index*60})`}>
                  <path className={s.logoPetalFill} d={petal}/><path className={s.logoPetalHit} d={petal}/>

                </g>
              </a>)}
            </svg>
            {wheelPaths.map((path,index) => {
              const angle = index * Math.PI / 3;
              return <article key={path.title} className={n.petalContent} data-petal-content={index} data-active={current===index} style={{left:`${(50+Math.sin(angle)*27.5).toFixed(4)}%`,top:`${(50-Math.cos(angle)*27.5).toFixed(4)}%`}}>
                <h3><button type="button" aria-label={`Select ${path.title}`} aria-pressed={current===index} tabIndex={position.zoom>.65 && current!==index?-1:0} onClick={()=>choose(index)}>{path.title}</button></h3>
                <div className={n.petalDetails}><div><p>{path.description}</p><p className={n.petalDetail}>{path.detail}</p>
                <a tabIndex={position.zoom>.65 && current===index?0:-1} href={path.href} aria-label={index===4?"Book a conversation":`Explore ${path.title}`}>{index===4?"Let’s talk":"Explore"} <span aria-hidden="true">↗</span></a></div></div>
              </article>;
            })}
          </div>
          <div className={n.core} aria-hidden="true"><Image src="/deepa-chakra-small.svg" alt="" width={60} height={60}/></div>
        </div></div>
        <div className={n.controls}><button type="button" aria-label="Previous petal" onClick={()=>choose((current+5)%6)}>←</button><p>{position.zoom>.65?"Scroll to the next petal.":"Scroll to look closer."}<button className={n.overview} type="button" onClick={()=>{manual.current=true;setPosition({index:1,angle:0,zoom:0,scrolling:false});}}>View whole flower</button></p><button type="button" aria-label="Next petal" onClick={()=>choose((current+1)%6)}>→</button></div>
      </div>
      <p className={n.selectionStatus} role="status">Selected: {item.title}. Use the link inside its petal to explore.</p>
    </nav>
  </div>;
}
