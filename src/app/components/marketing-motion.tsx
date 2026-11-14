"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import SectionTransitionScene from "./section-transition-scene";

const publicRoute = (path: string) => path === "/" || /^\/(about|approach|programmes|consultation|contact)(\/|$)/.test(path);

/** Shared choreography for every public page; normal navigation remains native. */
export default function MarketingMotion() {
  const pathname = usePathname();
  const marker = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!publicRoute(pathname) || pathname === "/") return;
    const root = marker.current?.closest<HTMLElement>(".marketing-home, .public-page, .marketing-programme-detail");
    if (!root) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const running = new Set<Animation>();
    const play = (node: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      if (motion.matches) return;
      const animation = node.animate(keyframes, options);
      running.add(animation);
      void animation.finished.then(() => running.delete(animation)).catch(() => running.delete(animation));
    };
    const entrance = () => {
      root.dataset.motionReady = "true";
      const hero = root.querySelector("h1");
      if (hero) play(hero, [{ clipPath: "inset(0 0 100% 0)", transform: "translateY(32px)", opacity: .2 }, { clipPath: "inset(0 0 0% 0)", transform: "translateY(0)", opacity: 1 }], { duration: 550, delay: 0, easing: "cubic-bezier(.22,1,.36,1)" });
    };
    entrance();
    const candidates = root.querySelectorAll<HTMLElement>("section h2, section article, .public-detail-heading, .contact-form-card, .contact-assessment-card, .marketing-detail-highlights > div, .marketing-footer-bottom");
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(entries => {
      let order = 0;
      entries.forEach(entry => {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target); observer.unobserve(entry.target);
        const title = entry.target.tagName === "H2";
        play(entry.target, title ? [
          { clipPath: "inset(0 0 100% 0)", translate: "0 28px", opacity: .2 },
          { clipPath: "inset(0 0 0% 0)", translate: "0 0", opacity: 1 },
        ] : [
          { opacity: 0, translate: "0 42px", rotate: "x 4deg" },
          { opacity: 1, translate: "0 0", rotate: "x 0deg" },
        ], { duration: title ? 950 : 800, delay: Math.min(order++ * 70, 210), easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" });
      });
    }, { threshold: .12 });
    candidates.forEach(node => observer.observe(node));

    const images = Array.from(root.querySelectorAll<HTMLImageElement>('section img:not([src*="chakra"])')).filter(image => !image.closest("[data-hero-garden]"));
    const imageObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      imageObserver.unobserve(entry.target);
      play(entry.target, [{ clipPath: "inset(8% 4% 8% 4% round 80px)", scale: "1.12" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", scale: "1" }], { duration: 1300, easing: "cubic-bezier(.22,1,.36,1)" });
    }), { threshold: .15 });
    images.forEach(image => imageObserver.observe(image));

    let frame = 0;
    const update = () => {
      frame = 0;
      if (motion.matches) return;
      const height = innerHeight;
      images.forEach(image => {
        const box = image.getBoundingClientRect();
        if (box.bottom < 0 || box.top > height || box.height < 150) return;
        const progress = Math.max(-1, Math.min(1, (box.top + box.height / 2 - height / 2) / height));
        image.style.translate = `0 ${progress * (innerWidth > 900 ? 12 : 5)}px`;
      });
      const header = root.querySelector<HTMLElement>(".marketing-header");
      if (header) header.dataset.scrolled = String(scrollY > 50);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const primary = 'a.home-button, a.marketing-button, a.marketing-header-cta, a[class*="__button"], a[class*="__aboutButton"]';
    let magnetic: HTMLElement | null = null;
    const resetMagnet = () => { magnetic?.style.removeProperty("translate"); magnetic = null; };
    const pointer = (event: PointerEvent) => {
      if (motion.matches || !finePointer.matches) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(primary) : null;
      if (magnetic !== target) resetMagnet();
      if (!target) return;
      magnetic = target;
      const box = target.getBoundingClientRect();
      target.style.translate = `${(event.clientX - box.left - box.width / 2) * .07}px ${(event.clientY - box.top - box.height / 2) * .12}px`;
    };
    const resetMotion = () => {
      if (motion.matches) {
        running.forEach(animation => animation.cancel());
        images.forEach(image => image.style.removeProperty("translate"));
        resetMagnet();
      }
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    root.addEventListener("pointermove", pointer, { passive: true });
    root.addEventListener("pointerleave", resetMagnet);
    motion.addEventListener("change", resetMotion);
    schedule();
    return () => {
      observer.disconnect(); imageObserver.disconnect();
      cancelAnimationFrame(frame); running.forEach(animation => animation.cancel());
      images.forEach(image => image.style.removeProperty("translate")); resetMagnet();
      delete root.dataset.motionReady;
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
      root.removeEventListener("pointermove", pointer); root.removeEventListener("pointerleave", resetMagnet);
      motion.removeEventListener("change", resetMotion);
    };
  }, [pathname]);

  if (!publicRoute(pathname) || pathname === "/") return null;
  return <>
    <span ref={marker} hidden aria-hidden="true" />
    <SectionTransitionScene key={pathname} />
  </>;
}
