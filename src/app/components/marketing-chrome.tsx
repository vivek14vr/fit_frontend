"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MarketingMotion from "./marketing-motion";

function BrandMark() {
  return (
    <span className="marketing-brand-mark" aria-hidden="true">
      <Image src="/deepa-chakra-small.svg" width={36} height={36} alt="" />
    </span>
  );
}

export function MarketingHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    const menuToggle = toggleRef.current;
    document.body.style.overflow = "hidden";
    mobileRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = Array.from(mobileRef.current?.querySelectorAll<HTMLElement>('a[href], button, summary') ?? [])
        .filter((element) => element.getClientRects().length > 0);
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const breakpoint = window.matchMedia("(min-width: 901px)");
    const closeOnDesktop = () => { if (breakpoint.matches) setMobileOpen(false); };
    breakpoint.addEventListener("change", closeOnDesktop);
    document.addEventListener("keydown", trapFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", trapFocus);
      breakpoint.removeEventListener("change", closeOnDesktop);
      (previousFocus ?? menuToggle)?.focus();
    };
  }, [mobileOpen]);

  const closeMenus = () => {
    setMobileOpen(false);
  };
  const isCurrent = (href: string) => href === "/programmes"
    ? pathname === href || pathname.startsWith("/programmes/")
    : pathname === href;

  return (
    <>
    <MarketingMotion />
    <header className="marketing-header">
      <div className="marketing-header-inner home-shell" inert={mobileOpen}>
        <Link className="marketing-brand" href="/" aria-label="Deepti Sherawat home" onClick={closeMenus}>
          <BrandMark />
          <span className="marketing-brand-copy">
            <strong>DEEPTI SHERAWAT</strong>
            <small>Nutritionist · Ayurveda · Modern science</small>
          </span>
        </Link>

        <nav className="marketing-desktop-nav" aria-label="Main navigation">
          <Link href="/about" aria-current={isCurrent("/about") ? "page" : undefined}>About Deepti</Link>
          <Link href="/programmes" onClick={closeMenus} aria-current={isCurrent("/programmes") ? "page" : undefined}>Programmes</Link>
          <Link href="/approach" aria-current={isCurrent("/approach") ? "page" : undefined}>How it works</Link>
          <Link href="/contact" aria-current={isCurrent("/contact") ? "page" : undefined}>Contact</Link>
        </nav>

        <div className="marketing-header-actions">
          <Link className="marketing-login-link" href="/login">Client login</Link>
          <Link className="marketing-header-cta" href="/consultation">Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className={`marketing-menu-toggle${mobileOpen ? " is-open" : ""}`}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((current) => !current)}
        >
          <span />
          <span />
        </button>
      </div>

      {mobileOpen ? (
        <div ref={mobileRef} className="marketing-mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <div className="marketing-mobile-menu-inner home-shell">
            <button type="button" className="marketing-mobile-close" onClick={closeMenus}>Close menu ×</button>
            <div className="marketing-mobile-menu-topline">
              <span>THE DEEPA CHAKRA</span>
              <span>01 / 04</span>
            </div>
            <nav className="marketing-mobile-nav" aria-label="Mobile navigation links">
              <Link href="/about" onClick={closeMenus} aria-current={isCurrent("/about") ? "page" : undefined}><span>01</span>About Deepti</Link>
              <Link href="/programmes" onClick={closeMenus} aria-current={isCurrent("/programmes") ? "page" : undefined}><span>02</span>Programmes</Link>
              <Link href="/approach" onClick={closeMenus} aria-current={isCurrent("/approach") ? "page" : undefined}><span>03</span>How it works</Link>
              <Link href="/contact" onClick={closeMenus} aria-current={isCurrent("/contact") ? "page" : undefined}><span>04</span>Contact</Link>
            </nav>
            <div className="marketing-mobile-actions">
              <Link className="marketing-mobile-primary" href="/consultation" onClick={closeMenus}>Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link>
              <Link href="/login" onClick={closeMenus}>Client login <span aria-hidden="true">↗</span></Link>
            </div>
            <p className="marketing-mobile-note">Nutritionist-led care for a life with more room in it.</p>
          </div>
        </div>
      ) : null}
    </header>
    </>
  );
}

export function MarketingFooter() {
  return (
    <footer className="marketing-footer" id="contact">
      <div className="home-shell marketing-footer-bottom">
        <div className="marketing-footer-brand"><BrandMark /><span><strong>DEEPTI SHERAWAT</strong><small>Nutritionist · Ayurveda · Modern science</small></span></div>
        <div className="marketing-footer-links">
          <Link href="/about">About Deepti</Link>
          <Link href="/programmes">Programmes</Link>
          <Link href="/approach">How it works</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/consultation">Book a 1:1 with Deepti</Link>
        </div>
      </div>
      <div className="home-shell marketing-footer-legal">
        <span>© {new Date().getFullYear()} Deepti Sherawat</span>
        <span>Information shared here is educational and is not a substitute for medical advice.</span>
      </div>
    </footer>
  );
}
