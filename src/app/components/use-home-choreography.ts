"use client";

import { type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** One owner for homepage entrances and scroll motion; artwork owns its own pointer response. */
export function useHomeChoreography(root: RefObject<HTMLDivElement | null>) {
  useGSAP(() => {
    const element = root.current;
    if (!element) return;
    element.setAttribute("data-motion-ready", "true");
    const media = gsap.matchMedia();
    let entered = false;
    media.add({ desktop: "(min-width: 901px)", mobile: "(max-width: 900px)", reduced: "(prefers-reduced-motion: reduce)" }, context => {
      if (context.conditions?.reduced) return;
      const select = gsap.utils.selector(element);
      const discovery = select('[data-transition-section="services"]')[0];
      const intro = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
      if (!entered && window.scrollY < 100) {
        intro.fromTo(select("[data-hero-line]"), { yPercent: 110, rotate: 2, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, stagger: .12, duration: 1.05, clearProps: "transform,opacity", immediateRender: false })
          .fromTo(select("[data-hero-support]"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .1, clearProps: "transform,opacity", immediateRender: false }, .35)
          .fromTo(select("[data-hero-media]"), { clipPath: "inset(0% 0% 0% 0%)", opacity: .2 }, { clipPath: "inset(0% 0% 0% 0% round 0%)", opacity: 1, duration: 1.4, clearProps: "clipPath,opacity", immediateRender: false }, .15);
      }
      const startIntro = () => {
        if (document.documentElement.dataset.entryStage === "loading") return;
        entered = true; intro.play();
      };
      const entryObserver = new MutationObserver(startIntro);
      entryObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-entry-stage"] });
      startIntro();

      // The photograph owns its slow zoom. Keep the hero container, caption and
      // pause control stationary; a second scroll transform causes crop drift.
      gsap.fromTo(select("[data-discovery-curve]"),
        { attr: { d: "M0 120 C260 120 290 0 600 0 C910 0 940 120 1200 120 L1200 160 L0 160 Z" } },
        { attr: { d: "M0 30 C260 0 290 80 600 80 C910 80 940 0 1200 30 L1200 160 L0 160 Z" }, ease: "none", scrollTrigger: { trigger: discovery, start: "top bottom", end: "top 25%", scrub: .7 } });
      gsap.fromTo(discovery, { backgroundColor: "#faf6ed" }, { backgroundColor: "#f1eadb", ease: "none", scrollTrigger: { trigger: discovery, start: "top bottom", end: "center center", scrub: .6 } });
      gsap.fromTo(select("[data-discovery-curve]"), { fill: "#faf6ed" }, { fill: "#f1eadb", ease: "none", scrollTrigger: { trigger: discovery, start: "top bottom", end: "center center", scrub: .6 } });

      // Reveal once; no persistent CSS visibility rule can hide content if JS fails.
      select("[data-home-reveal]").forEach((node: HTMLElement) => {
        if (node.closest('[data-transition-section="hero"]') || node.id === "programme-panel") return;
        const direction = node.dataset.reveal;
        gsap.fromTo(node, { y: direction === "scale" ? 24 : 18, scale: direction === "scale" ? .98 : 1 }, {
          y: 0, scale: 1, duration: .65, ease: "power3.out", immediateRender: false,
          scrollTrigger: { trigger: node, start: "top 98%", once: true, fastScrollEnd: true }, clearProps: "transform",
        });
      });
      select("[data-motion-portrait]").forEach((node: HTMLElement) => {
        gsap.fromTo(node, { clipPath: "inset(5% 7% 5% 7% round 45% 45% 4% 4%)" }, { clipPath: "inset(0% 0% 0% 0% round 0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: node, start: "top 90%", end: "center 55%", scrub: .5 } });
      });
      select("[data-editorial-image]").forEach((node: HTMLElement) => {
        gsap.fromTo(node, { scale: 1.12, yPercent: -3 }, { scale: 1.03, yPercent: 3, ease: "none",
          scrollTrigger: { trigger: node.parentElement, start: "top bottom", end: "bottom top", scrub: .7 },
        });
      });
      select("[data-step-list]").forEach((node: HTMLElement) => {
        gsap.fromTo(Array.from(node.children), { x: 24 }, { x: 0, stagger: .09, duration: .7, ease: "power3.out", immediateRender: false,
          scrollTrigger: { trigger: node, start: "top 95%", once: true }, clearProps: "transform",
        });
      });
      gsap.fromTo(select("[data-close-logo]"), { rotate: -70, scale: .6, opacity: .1 }, { rotate: 0, scale: 1, opacity: 1, ease: "power2.out", scrollTrigger: { trigger: '[data-transition-section="close"]', start: "top 95%", end: "center 70%", scrub: .7 } });

      return () => { entryObserver.disconnect(); };
    });
    let refreshFrame = 0;
    let alive = true;
    const refresh = () => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => { if (alive) ScrollTrigger.refresh(); });
    };
    const resize = new ResizeObserver(refresh);
    resize.observe(element);
    void document.fonts.ready.then(() => { if (alive) refresh(); });
    const headerTrigger = ScrollTrigger.create({ start: 0, end: "max", onUpdate: self => {
      const header = element.querySelector<HTMLElement>(".marketing-header");
      if (header) header.dataset.scrolled = String(self.scroll() > 50);
    } });
    return () => {
      alive = false; cancelAnimationFrame(refreshFrame); resize.disconnect();
      headerTrigger.kill(); media.revert(); element.removeAttribute("data-motion-ready");
    };
  }, { scope: root });
}
