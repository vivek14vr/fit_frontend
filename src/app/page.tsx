"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MarketingHeader, MarketingFooter } from "./components/marketing-chrome";
import { programmeData } from "./components/marketing-data";
import s from "./homepage.module.css";
import HomePhoto from "./components/home-photo";
import HeroLivingGarden from "./components/hero-living-garden";
import ServicePetalWheel from "./components/service-petal-wheel";
import BrandFlowerMark from "./components/brand-flower-mark";
import { useHomeChoreography } from "./components/use-home-choreography";

const images = [
  "/programmes/gut.jpg",
  "/programmes/liver.jpg",
  "/programmes/metabolic.jpg",
  "/programmes/skin.jpg",
];
const steps = [
  ["A conversation first", "Bring your questions, your food habits and your everyday reality. The first conversation helps us understand your priorities and whether the practice is the right fit."],
  ["A plan with your life in mind", "Your preferences, routines and goals shape the food and lifestyle guidance. You leave with practical steps you can understand and begin."],
  ["Small steps, regular reflection", "Notice what feels useful, share what feels difficult, and review your progress together. Your plan can evolve as your needs become clearer."],
];
const questions = [
  ["What should I prepare?", "Bring your questions and a picture of your usual meals, routines and nutrition goals. You do not need to select a programme before the call."],
  ["What does the consultation cost?", "The direct 1:1 Health Assessment with Deepti is ₹1,500 in India. US/international call booking is currently free. Choose your region on the consultation page to see the appropriate booking option."],
  ["Where should I begin?", "Start with a consultation. You do not need to choose a programme beforehand; the conversation helps clarify your priorities and the appropriate next step."],
  ["Is this medical care?", "Deepti is a nutritionist. The practice offers nutrition education and personalised guidance, and does not replace diagnosis, treatment or advice from your medical team."],
  ["Will my food preferences be considered?", "Your usual foods, cultural preferences and daily routine belong in the conversation. Share dietary restrictions and relevant medical advice during your consultation."],
  ["How long is a programme?", "Duration, review frequency and fees will be confirmed before you enrol, based on the programme and agreed scope of support."],
];
const metabolicSignals = [
  "A scan or recent report has shown fatty liver",
  "Stubborn weight is not responding the way it used to",
  "Cholesterol, triglycerides or other metabolic markers are moving in the wrong direction",
];

export default function Home() {
  const [active, setActive] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showMobileBooking, setShowMobileBooking] = useState(false);
  const [step, setStep] = useState<number | null>(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const programmeSection = useRef<HTMLElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const manualProgramme = useRef(false);
  const programme = programmeData[active];
  useHomeChoreography(root);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const sections = Array.from(element.querySelectorAll<HTMLElement>('[data-transition-section="hero"], [data-transition-section="services"], [data-transition-section="close"], .marketing-footer'));
    const visible = new Set<Element>(sections);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target); });
      setShowMobileBooking(visible.size === 0);
    });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = programmeSection.current;
    if (!section || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || manualProgramme.current) return;
        const index = Number((entry.target as HTMLElement).dataset.programmeStep);
        if (Number.isInteger(index)) setActive(index);
      });
    }, { rootMargin: "-42% 0px -42% 0px", threshold: 0.01 });
    section.querySelectorAll("[data-programme-step]").forEach(element => observer.observe(element));
    const resume = () => { manualProgramme.current = false; };
    const resumeKeys = (event: KeyboardEvent) => {
      if (["PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End", " "].includes(event.key)) resume();
    };
    window.addEventListener("wheel", resume, { passive: true });
    window.addEventListener("touchstart", resume, { passive: true });
    window.addEventListener("keydown", resumeKeys);
    return () => {
      observer.disconnect();
      window.removeEventListener("wheel", resume);
      window.removeEventListener("touchstart", resume);
      window.removeEventListener("keydown", resumeKeys);
    };
  }, []);

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      element.style.setProperty("--home-scroll-progress", String(scrollable > 0 ? window.scrollY / scrollable : 0));
    };
    const scheduleProgress = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };
    const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(scheduleProgress) : null;

    updateProgress();
    window.addEventListener("scroll", scheduleProgress, { passive: true });
    window.addEventListener("resize", scheduleProgress);
    resizeObserver?.observe(element);

    return () => {
      window.removeEventListener("scroll", scheduleProgress);
      window.removeEventListener("resize", scheduleProgress);
      resizeObserver?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={root} className={`marketing-home ${s.page}`} data-home-choreography>
      <a className={s.skip} href="#main-content">Skip to content</a>
      <MarketingHeader />
      <div className={s.scrollProgress} aria-hidden="true"><span /></div>
      <main id="main-content" tabIndex={-1}>
        <section className={s.hero} data-transition-section="hero">
          <div className={s.heroCopy}>
            <p className={s.eyebrow} data-hero-support><span /> DEEPTI SHERAWAT · NUTRITIONIST</p>
            <h1 aria-label="A little balance. A lot more you."><span className={s.heroLine}><span data-hero-line>A little</span></span><span className={s.heroLine}><span data-hero-line>balance.</span></span><span className={s.heroLine}><em data-hero-line>A lot more you.</em></span></h1>
            <p className={s.lede} data-hero-support>Food you love. A rhythm that fits. Personal nutrition with Deepti, bringing Ayurveda and modern science into your everyday life.</p>
            <div className={s.actions} data-hero-support><Link className={s.button} href="/consultation">Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link><a className={s.textLink} href="#discover-your-path">Find your starting point <span aria-hidden="true">↓</span></a></div>
            <div className={s.heroNote} data-hero-support><span className={s.noteLine} />Your story first. Your nutrition plan next.</div>
          </div>
          <div className={s.heroMedia} data-hero-media><HeroLivingGarden /></div>
        </section>

        <div className={s.principles}><span>Rooted in Ayurveda</span><i aria-hidden="true">✦</i><span>Informed by modern science</span><i aria-hidden="true">✦</i><span>Personal to you</span></div>

        <section id="discover-your-path" className={s.serviceDiscovery} data-transition-section="services" aria-labelledby="service-discovery-title">
          <svg className={s.discoveryCurve} viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true"><path data-discovery-curve d="M0 120 C260 120 290 0 600 0 C910 0 940 120 1200 120 L1200 160 L0 160 Z" /></svg>
          <div className={`${s.section} ${s.serviceDiscoveryInner}`}>
            <div className={s.serviceDiscoveryCopy} data-home-reveal data-reveal="left">
              <p className={s.eyebrow}>CHOOSE YOUR STARTING POINT</p>
              <h2 id="service-discovery-title">Your own way<br /><em>to feel more you.</em></h2>
              <p>Every person arrives with a different question. Choose a petal, discover your path, and take the next step when you feel ready.</p>
            </div>
          </div>
          <div className={s.serviceWheelStage}><ServicePetalWheel /></div>
        </section>

        <section id="about-deepti" className={s.about} data-transition-section="about">
          <div className={`${s.section} ${s.aboutGrid}`}>
            <div className={s.aboutPortrait} data-motion-portrait data-home-reveal data-reveal="scale">
              <Image src="/deepti.webp" alt="Deepti Sherawat, nutritionist" width={768} height={1152} sizes="(max-width: 900px) calc(100vw - 48px), 34vw" className={s.aboutPortraitImage} data-editorial-image />
              <div className={s.aboutPortraitCaption}><span>DEEPTI SHERAWAT</span><small>Ayurveda · Functional nutrition</small></div>
            </div>
            <div data-home-reveal data-reveal="right"><p className={s.eyebrow}>YOUR NUTRITIONIST</p><h2>Where Ayurveda meets<br /><em>functional nutrition.</em></h2><p>For more than 10 years and 700+ client journeys worldwide, Deepti has worked at the intersection of Ayurveda, functional nutrition and metabolic health.</p><p>Her approach looks at digestion, food patterns, lifestyle, body type and health markers—especially when Indian eating habits meet the realities of modern life abroad.</p><ul className={s.aboutValues} aria-label="What guides the conversation"><li><span>01</span>Digestion &amp; rhythm</li><li><span>02</span>Food patterns</li><li><span>03</span>Health markers</li></ul><Link href="/consultation" className={s.aboutButton}>Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link></div>
          </div>
        </section>

        <section id="first-conversation" className={`${s.section} ${s.callIntroduction}`} data-transition-section="conversation">
          <div data-home-reveal data-reveal="left"><p className={s.eyebrow}>YOUR FIRST CONVERSATION</p><h2>Space to be heard.<br /><em>Clarity to begin.</em></h2></div>
          <div data-home-reveal data-reveal="right"><p>A 1:1 Health Assessment with Deepti begins with you—not a preset programme. Bring your questions and the everyday realities that shape how you eat.</p><ol className={s.callDetails} data-step-list><li><span>01</span>Your priorities, food habits and routine</li><li><span>02</span>A conversation about your nutrition goals</li><li><span>03</span>Guidance on an appropriate next step</li></ol><Link href="/consultation" className={s.textLink}>View consultation options <span aria-hidden="true">↗</span></Link><p className={s.callPricing}>US &amp; international: complimentary for now · India: ₹1,500</p></div>
        </section>

        <section id="watch-video" className={`${s.section} ${s.videoSection}`} data-transition-section="approach">
          <div className={s.videoHeading} data-home-reveal data-reveal="up">
            <div><p className={s.eyebrow}>SEE THE APPROACH</p><h2>See how thoughtful care<br /><em>becomes a plan.</em></h2></div>
            <div><p>Watch a short introduction to Deepti’s personalised Ayurveda and functional nutrition programme, then choose the next step that feels right for you.</p><Link href="/consultation" className={s.textLink}>Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link></div>
          </div>
          <div className={s.videoFrame} data-home-reveal data-reveal="scale">
            {videoPlaying ? <iframe src="https://player.vimeo.com/video/1224198548?title=0&byline=0&portrait=0&dnt=1&autoplay=1" title="Watch Deepti's personalised health programme introduction" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : <button type="button" className={s.videoPoster} onClick={() => setVideoPlaying(true)} aria-label="Play Deepti’s programme introduction"><Image src="/editorial/approach-cooking.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 1180px" /><span className={s.videoPlay} aria-hidden="true">▶</span><span className={s.videoPosterCaption}>A thoughtful approach.<br /><em>A more personal plan.</em><small>WATCH THE INTRODUCTION ↗</small></span></button>}
          </div>
          <p className={s.videoFallback}>Prefer Vimeo? <a href="https://vimeo.com/1224198548" target="_blank" rel="noreferrer">Open the video in a new tab <span aria-hidden="true">↗</span></a></p>
        </section>

        <section className={s.metabolicBand} data-transition-section="metabolic">
          <div className={`${s.section} ${s.metabolicFocus}`}>
            <div className={s.metabolicPhoto} data-home-reveal data-reveal="scale"><Image data-editorial-image src="/editorial/approach-cooking.jpg" alt="Preparing a meal with everyday ingredients" fill sizes="(max-width: 900px) 100vw, 45vw" /><span>Small rituals. Lasting possibilities.</span></div>
            <div className={s.metabolicIntro} data-home-reveal data-reveal="left">
              <p className={s.eyebrow}>A FOCUSED 12-WEEK PATH</p>
              <h2>Your health goals.<br /><em>Your everyday food.</em></h2>
              <p>A personalised programme combining <strong>Ayurveda + functional nutrition</strong> to account for South Asian bodies, Indian eating patterns and life in the US &amp; Canada.</p>
              <Link href="/programmes/weight-metabolic" className={s.textLink}>Explore metabolic health <span aria-hidden="true">↗</span></Link>
            </div>
            <div className={s.metabolicCard} data-home-reveal data-reveal="right">
              <p className={s.eyebrow}>THIS MAY BE FOR YOU IF…</p>
              <ul data-step-list>{metabolicSignals.map(signal => <li key={signal}><span aria-hidden="true">✓</span>{signal}</li>)}</ul>
              <p className={s.metabolicNote}>The work looks at the bigger metabolic picture, not one concern in isolation.</p>
            </div>
          </div>
        </section>

        <section id="programmes" className={s.programmes} ref={programmeSection} data-transition-section="programmes">
          <div className={s.section}>
            <div className={s.sectionHead} data-home-reveal><div><p className={s.eyebrow}>FOUR PATHS. ONE PERSONAL APPROACH.</p><h2>What brings<br /><em>you here?</em></h2></div><p>Begin with what matters to you. Explore the programmes, then talk through the right starting point together.</p></div>
            <div className={s.programmeStory} style={{ "--programme-progress": (active + 1) / programmeData.length } as CSSProperties}>
              <div className={s.programmeStorySticky}>
                <div className={s.tabs} role="tablist" aria-label="Explore nutrition programmes">
                  {programmeData.map((item, index) => <button key={item.slug} ref={el => { tabs.current[index] = el; }} type="button" role="tab" id={`programme-tab-${index}`} aria-controls="programme-panel" aria-selected={active === index} tabIndex={active === index ? 0 : -1} onClick={() => { manualProgramme.current = true; setActive(index); }} onKeyDown={event => {
                    let next = index;
                    if (event.key === "ArrowRight") next = (index + 1) % 4;
                    else if (event.key === "ArrowLeft") next = (index + 3) % 4;
                    else if (event.key === "Home") next = 0;
                    else if (event.key === "End") next = 3;
                    else return;
                    event.preventDefault(); manualProgramme.current = true; setActive(next); tabs.current[next]?.focus();
                  }}><small>{item.number}</small>{item.title}</button>)}
                </div>
                <div key={programme.slug} id="programme-panel" role="tabpanel" aria-labelledby={`programme-tab-${active}`} tabIndex={0} className={s.programmePanel} data-home-reveal data-reveal="scale">
                  <div className={s.programmePhoto}><HomePhoto src={images[active]} alt={`Illustrative whole foods for the ${programme.title} programme`} sizes="(max-width: 900px) calc(100vw - 40px), (max-width: 1244px) calc(50vw - 32px), 590px" /></div>
                  <div className={s.programmeTextGrid}>{programmeData.map((item, index) => <div key={item.slug} className={`${s.programmeCopy} ${active !== index ? s.inactiveProgramme : ""}`} aria-hidden={active !== index} inert={active !== index}><p className={s.eyebrow}>{item.eyebrow}</p><h3>{item.title}</h3><p>{item.description}</p><ul>{item.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul><Link href={`/programmes/${item.slug}`} className={s.programmeLink}>Explore {item.shortTitle} <span aria-hidden="true">↗</span></Link></div>)}</div>
                </div>
              </div>
              <div className={s.programmeStorySteps} aria-hidden="true">
                {programmeData.map((item, index) => <div key={item.slug} data-programme-step={index} className={s.programmeStoryStep} style={{ "--programme-index": index } as CSSProperties} />)}
              </div>
            </div>
            <p className={s.programmeHelp}>Unsure which path is right? <Link href="/consultation">Start with a conversation ↗</Link></p>
          </div>
        </section>

        <section id="how-it-works" className={`${s.section} ${s.journey}`} data-transition-section="journey">
          <div data-home-reveal data-reveal="left"><p className={s.eyebrow}>A LITTLE CLARITY, AT EVERY STEP</p><h2>A journey that<br /><em>moves with you.</em></h2><p>From the first conversation to the small choices that become part of your day.</p><span className={s.journeyNote}>Understand → Practise → Reflect</span></div>
          <div className={s.journeySteps} data-home-reveal data-reveal="right" style={{ "--journey-progress": step === null ? 0 : (step + 1) / steps.length } as CSSProperties}>{steps.map(([title, description], index) => <div className={`${s.step}${step === index ? ` ${s.stepActive}` : ""}`} key={title}><h3><button type="button" aria-expanded={step === index} aria-controls={`step-${index}`} onClick={() => setStep(step === index ? null : index)}><small>0{index + 1}</small>{title}<span aria-hidden="true">{step === index ? "−" : "+"}</span></button></h3><div id={`step-${index}`} hidden={step !== index}><p>{description}</p></div></div>)}</div>
        </section>


        <section className={`${s.section} ${s.faq}`} data-transition-section="faq"><div data-home-reveal data-reveal="left"><p className={s.eyebrow}>BEFORE WE BEGIN</p><h2>A few things<br /><em>you may wonder.</em></h2></div><div data-home-reveal data-reveal="right">{questions.map(([question, answer]) => <details className={s.question} key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

        <section className={s.close} data-home-reveal data-transition-section="close"><div className={s.section}><div className={s.closingFlower} data-close-logo><BrandFlowerMark /></div><p className={s.eyebrow}>ONE CONVERSATION. A THOUGHTFUL BEGINNING.</p><h2>Let’s begin<br /><em>with you.</em></h2><p>Bring your questions. We’ll explore the next step together.</p><Link href="/consultation" className={s.button}>Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link><p className={s.bookingNote}>Consultation options and fees are shown before you book.</p></div></section>
      </main>
      <MarketingFooter />
      <div className={s.mobileBooking} data-visible={showMobileBooking}><Link href="/consultation">Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link></div>
    </div>
  );
}
