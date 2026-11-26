"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MarketingHeader, MarketingFooter } from "./components/marketing-chrome";
import { programmeData } from "./components/marketing-data";
import s from "./homepage.module.css";
import HomePhoto from "./components/home-photo";
import ServicePetalWheel from "./components/service-petal-wheel";
import BrandFlowerMark from "./components/brand-flower-mark";
import { useHomeChoreography } from "./components/use-home-choreography";
import StickySocialLinks from "./components/sticky-social-links";
import SpecialtyStudio from "./components/specialty-studio";
import TestimonialCarousel from "./components/testimonial-carousel";

const steps = [
  ["Listen first", "Bring the questions that have stayed with you, your food patterns, your routines and the context around them. The first conversation is about understanding before recommending."],
  ["Make the pattern clearer", "We connect the useful details—digestion, energy, sleep, stress, habits and relevant health markers—so the next step is easier to see."],
  ["Practise, review, adjust", "Choose a small number of realistic changes, notice what happens in your week, and return to the conversation with what you have learned."],
];
const questions = [
  ["What should I prepare?", "Bring your questions and a picture of your usual meals, routines and nutrition goals. You do not need to select a programme before the call."],
  ["What does the consultation cost?", "The direct 1:1 Health Assessment with Deepti is ₹1,500 in India. Online consultations from elsewhere in the world are currently complimentary. Choose your region on the consultation page to see the appropriate booking option."],
  ["Where should I begin?", "Start with a consultation. You do not need to choose a programme beforehand; the conversation helps clarify your priorities and the appropriate next step."],
  ["Is this medical care?", "Deepti is a nutritionist. The practice offers nutrition education and personalised guidance, and does not replace diagnosis, treatment or advice from your medical team."],
  ["Will my food preferences be considered?", "Your usual foods, cultural preferences and daily routine belong in the conversation. Share dietary restrictions and relevant medical advice during your consultation."],
  ["How long is a programme?", "Duration, review frequency and fees will be confirmed before you enrol, based on the programme and agreed scope of support."],
];
const metabolicSignals = [
  "Your appetite, energy or weight feels harder to understand",
  "A report or changing marker has raised new questions",
  "You are tired of starting over with food and routines",
  "You want a practical plan that can fit your actual week",
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
            <p className={s.eyebrow} data-hero-support><span /> PERSONAL NUTRITION · INDIA + WORLDWIDE ONLINE</p>
            <h1 aria-label="When health feels complicated, start with the everyday."><span className={s.heroLine}><span data-hero-line>When health</span></span><span className={s.heroLine}><span data-hero-line>feels complicated,</span></span><span className={s.heroLine}><em data-hero-line>start with the everyday.</em></span></h1>
            <p className={s.lede} data-hero-support>Personal nutrition guidance for digestion, metabolic health, hormones, skin and the daily patterns around them—grounded in Ayurveda, functional nutrition and your real life.</p>
            <div className={s.actions} data-hero-support><Link className={s.button} href="/consultation">Talk through your goals <span aria-hidden="true">↗</span></Link><a className={s.textLink} href="#discover-your-path">Find your starting point <span aria-hidden="true">↓</span></a></div>
            <div className={s.heroNote} data-hero-support><span className={s.noteLine} />Understand the pattern. Choose the next useful step.</div>
          </div>
          <div className={s.heroMedia} data-hero-media>
            <Image className={s.heroPortraitImage} src="/deepti.webp" alt="Deepti Sherawat, nutritionist" fill loading="eager" fetchPriority="high" sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 900px) calc(100vw - 64px), 52vw" />
            <div className={s.heroPortraitShade} aria-hidden="true" />
            <p className={s.heroPortraitCaption}><span>DEEPTI SHERAWAT</span>Based in India · Consulting worldwide online</p>
          </div>
        </section>

        <div className={s.principles}><span>Rooted in Ayurveda</span><i aria-hidden="true">✦</i><span>Informed by modern science</span><i aria-hidden="true">✦</i><span>Personal to you</span></div>

        <section id="discover-your-path" className={s.serviceDiscovery} data-transition-section="services" aria-labelledby="service-discovery-title">
          <svg className={s.discoveryCurve} viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true"><path data-discovery-curve d="M0 120 C260 120 290 0 600 0 C910 0 940 120 1200 120 L1200 160 L0 160 Z" /></svg>
          <div className={`${s.section} ${s.serviceDiscoveryInner}`}>
            <div className={s.serviceDiscoveryCopy} data-home-reveal data-reveal="left">
              <p className={s.eyebrow}>CHOOSE YOUR STARTING POINT</p>
              <h2 id="service-discovery-title">One practice.<br /><em>Many starting points.</em></h2>
              <p>You do not need the perfect label before you begin. Choose a focus area, explore the programmes or start with a conversation about what has been on your mind.</p>
            </div>
          </div>
          <div className={s.serviceWheelStage}><ServicePetalWheel /></div>
        </section>

        <section id="about-deepti" className={s.about} data-transition-section="about">
          <div className={`${s.section} ${s.aboutGrid}`}>
            <div className={s.aboutIntro} data-home-reveal data-reveal="left">
              <p className={s.eyebrow}>YOUR NUTRITIONIST</p>
              <h2>Nutrition that looks<br /><em>at the whole picture.</em></h2>
              <ul className={s.aboutProof} aria-label="Deepti's practice at a glance">
                <li><strong>10+</strong><span>Years in practice</span></li>
                <li><strong>700+</strong><span>Client journeys</span></li>
                <li><strong>Worldwide</strong><span>Online consultations</span></li>
              </ul>
            </div>
            <div className={s.aboutCopy} data-home-reveal data-reveal="right"><p>Deepti brings Ayurveda, functional nutrition and metabolic health into one practical conversation—without reducing your experience to a single symptom or number.</p><p>Together, you can look at food patterns, digestion, energy, sleep, stress, routines and relevant health markers, then choose changes that make sense for your life.</p><ul className={s.aboutValues} aria-label="What guides the conversation"><li><span>01</span>Context first</li><li><span>02</span>Practical steps</li><li><span>03</span>Shared review</li></ul><Link href="/consultation" className={s.aboutButton}>Start with a conversation <span aria-hidden="true">↗</span></Link></div>
          </div>
        </section>

        <SpecialtyStudio />

        <section id="first-conversation" className={`${s.section} ${s.callIntroduction}`} data-transition-section="conversation">
          <div data-home-reveal data-reveal="left"><p className={s.eyebrow}>THE FIRST STEP</p><h2>Bring the whole question.<br /><em>Leave with a clearer next step.</em></h2></div>
          <div data-home-reveal data-reveal="right"><p>A 1:1 Health Assessment is a space to talk through what you have noticed, what you have tried and what you want to understand. We consider your priorities, routine and relevant reports before discussing whether a programme is right for you.</p><ol className={s.callDetails} data-step-list><li><span>01</span>Your history, food patterns and priorities</li><li><span>02</span>The routines and markers worth noticing</li><li><span>03</span>A practical next step, if the practice is a good fit</li></ol><Link href="/consultation" className={s.textLink}>View consultation options <span aria-hidden="true">↗</span></Link><p className={s.callPricing}>Based in India · Online from anywhere in the world</p></div>
        </section>

        <section id="watch-video" className={`${s.section} ${s.videoSection}`} data-transition-section="approach">
          <div className={s.videoHeading} data-home-reveal data-reveal="up">
            <div><p className={s.eyebrow}>SEE THE DIFFERENCE</p><h2>Thoughtful nutrition<br /><em>for real-life health.</em></h2></div>
            <div><p>See how Deepti brings context, food and daily rhythm into a plan—without promising a quick fix or asking you to live perfectly.</p><Link href="/consultation" className={s.textLink}>Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link></div>
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
              <p className={s.eyebrow}>A PERSONAL PATH FOR METABOLIC HEALTH</p>
              <h2>Understand the patterns.<br /><em>Change what you can keep.</em></h2>
              <p>A focused programme for people exploring weight, appetite, energy, fatty liver or changing metabolic markers—with <strong>Ayurveda + functional nutrition</strong> shaped around South Asian food and everyday life.</p>
              <Link href="/programmes/weight-metabolic" className={s.textLink}>Explore the metabolic path <span aria-hidden="true">↗</span></Link>
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
            <div className={s.sectionHead} data-home-reveal><div><p className={s.eyebrow}>SIX STARTING POINTS. ONE PERSONALISED PRACTICE.</p><h2>Choose what brought<br /><em>you here.</em></h2></div><p>Explore digestion, liver wellbeing, metabolic health, skin, hormones or mood—then talk with Deepti before deciding what comes next.</p></div>
            <div className={s.programmeStory} style={{ "--programme-progress": (active + 1) / programmeData.length, "--programme-count": programmeData.length } as CSSProperties}>
              <div className={s.programmeStorySticky}>
                <div className={s.tabs} role="tablist" aria-label="Explore nutrition programmes">
                  {programmeData.map((item, index) => <button key={item.slug} ref={el => { tabs.current[index] = el; }} type="button" role="tab" id={`programme-tab-${index}`} aria-controls="programme-panel" aria-selected={active === index} tabIndex={active === index ? 0 : -1} onClick={() => { manualProgramme.current = true; setActive(index); }} onKeyDown={event => {
                    let next = index;
                    if (event.key === "ArrowRight") next = (index + 1) % programmeData.length;
                    else if (event.key === "ArrowLeft") next = (index + programmeData.length - 1) % programmeData.length;
                    else if (event.key === "Home") next = 0;
                    else if (event.key === "End") next = programmeData.length - 1;
                    else return;
                    event.preventDefault(); manualProgramme.current = true; setActive(next); tabs.current[next]?.focus();
                  }}><small>{item.number}</small>{item.title}</button>)}
                </div>
                <div key={programme.slug} id="programme-panel" role="tabpanel" aria-labelledby={`programme-tab-${active}`} tabIndex={0} className={s.programmePanel} data-home-reveal data-reveal="scale">
                  <div className={s.programmePhoto}><HomePhoto src={programme.image} alt={`Illustrative whole foods for the ${programme.title} programme`} sizes="(max-width: 900px) calc(100vw - 40px), (max-width: 1244px) calc(50vw - 32px), 590px" /></div>
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
          <div data-home-reveal data-reveal="left"><p className={s.eyebrow}>HOW SUPPORT TAKES SHAPE</p><h2>Understand first.<br /><em>Then make it useful.</em></h2><p>Good guidance turns complexity into a few things you can notice, practise and review.</p><span className={s.journeyNote}>Listen → Make sense → Practise</span></div>
          <div className={s.journeySteps} data-home-reveal data-reveal="right" style={{ "--journey-progress": step === null ? 0 : (step + 1) / steps.length } as CSSProperties}>{steps.map(([title, description], index) => <div className={`${s.step}${step === index ? ` ${s.stepActive}` : ""}`} key={title}><h3><button type="button" aria-expanded={step === index} aria-controls={`step-${index}`} onClick={() => setStep(step === index ? null : index)}><small>0{index + 1}</small>{title}<span aria-hidden="true">{step === index ? "−" : "+"}</span></button></h3><div id={`step-${index}`} hidden={step !== index}><p>{description}</p></div></div>)}</div>
        </section>

        <TestimonialCarousel
          placement="homepage"
          variant="homepage"
          heading="Real experiences, shared with care."
          description="Approved reflections from people who have worked with Deepti. Every story remains personal; no experience is presented as a promised outcome."
        />

        <section className={`${s.section} ${s.faq}`} data-transition-section="faq"><div data-home-reveal data-reveal="left"><p className={s.eyebrow}>BEFORE WE BEGIN</p><h2>A few things<br /><em>you may wonder.</em></h2></div><div data-home-reveal data-reveal="right">{questions.map(([question, answer]) => <details className={s.question} key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

        <section className={s.close} data-home-reveal data-transition-section="close"><div className={s.section}><div className={s.closingFlower} data-close-logo><BrandFlowerMark /></div><p className={s.eyebrow}>A GOOD PLACE TO BEGIN</p><h2>You do not need all the answers.<br /><em>Just your first question.</em></h2><p>Bring the questions that have stayed with you. We will find a considered next step together.</p><Link href="/consultation" className={s.button}>Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link><p className={s.bookingNote}>Consultation options and fees are shown before you book.</p></div></section>
      </main>
      <MarketingFooter />
      <div className={s.mobileBooking} data-visible={showMobileBooking}><Link href="/consultation">Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link></div>
      <StickySocialLinks />
    </div>
  );
}
