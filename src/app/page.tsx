"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MarketingHeader, MarketingFooter } from "./components/marketing-chrome";
import { programmeData } from "./components/marketing-data";
import s from "./homepage.module.css";
import HomePhoto from "./components/home-photo";
import HeroAmbientScene from "./components/hero-ambient-scene";

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
  const [step, setStep] = useState<number | null>(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const programmeSteps = useRef<(HTMLDivElement | null)[]>([]);
  const programmeSection = useRef<HTMLElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const programme = programmeData[active];

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(s.revealed);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    root.current?.querySelectorAll("[data-home-reveal]").forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = programmeSection.current;
    if (!section || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const index = Number((entry.target as HTMLElement).dataset.programmeStep);
        if (Number.isInteger(index)) setActive(index);
      });
    }, { rootMargin: "-42% 0px -42% 0px", threshold: 0.01 });
    section.querySelectorAll("[data-programme-step]").forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={root} className={`marketing-home ${s.page}`}>
      <a className={s.skip} href="#main-content">Skip to content</a>
      <MarketingHeader />
      <main id="main-content" tabIndex={-1}>
        <section className={s.hero}>
          <div className={s.heroCopy}>
            <p className={s.eyebrow}><span /> DEEPTI SHERAWAT · NUTRITIONIST</p>
            <h1>Your health.<br />A more personal<br /><em>conversation.</em></h1>
            <p className={s.lede}>Explore your food habits, your concerns and what comes next. One-to-one with Deepti, bringing together Ayurveda and modern nutrition science.</p>
            <div className={s.actions}><Link className={s.button} href="/consultation">Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link><a className={s.textLink} href="#first-conversation">What to expect <span aria-hidden="true">↓</span></a></div>
            <div className={s.heroNote}><span className={s.noteLine} />Start with a conversation. No programme selection needed.</div>
          </div>
          <div className={s.heroPhoto}>
            <HomePhoto src="/programmes/metabolic.jpg" alt="Fresh vegetables and ingredients ready to prepare a nourishing meal" priority sizes="(max-width: 900px) 100vw, 50vw" />
            <HeroAmbientScene />
            <div className={s.photoCaption}><span>THE EVERYDAY PRACTICE</span><p>Good food.<br /><em>A gentler rhythm.</em></p></div>
          </div>
        </section>

        <div className={s.principles}><span>Rooted in Ayurveda</span><i aria-hidden="true">✦</i><span>Informed by modern science</span><i aria-hidden="true">✦</i><span>Personal to you</span></div>

        <section id="first-conversation" className={`${s.section} ${s.callIntroduction}`}>
          <div><p className={s.eyebrow}>YOUR FIRST CONVERSATION</p><h2>Space to be heard.<br /><em>Clarity to begin.</em></h2></div>
          <div><p>A 1:1 Health Assessment with Deepti begins with you—not a preset programme. Bring your questions and the everyday realities that shape how you eat.</p><ol className={s.callDetails}><li><span>01</span>Your priorities, food habits and routine</li><li><span>02</span>A conversation about your nutrition goals</li><li><span>03</span>Guidance on an appropriate next step</li></ol><Link href="/consultation" className={s.textLink}>View consultation options <span aria-hidden="true">↗</span></Link><p className={s.callPricing}>US &amp; international: complimentary for now · India: ₹1,500</p></div>
        </section>

        <section id="watch-video" className={`${s.section} ${s.videoSection}`} data-home-reveal>
          <div className={s.videoHeading}>
            <div><p className={s.eyebrow}>SEE THE APPROACH</p><h2>See how thoughtful care<br /><em>becomes a plan.</em></h2></div>
            <div><p>Watch a short introduction to Deepti’s personalised Ayurveda and functional nutrition programme, then choose the next step that feels right for you.</p><Link href="/consultation" className={s.textLink}>Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link></div>
          </div>
          <div className={s.videoFrame}>
            <iframe src="https://player.vimeo.com/video/1224198548?title=0&byline=0&portrait=0&dnt=1" title="Watch Deepti's personalised health programme introduction" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen loading="lazy" />
          </div>
          <p className={s.videoFallback}>Prefer Vimeo? <a href="https://vimeo.com/1224198548" target="_blank" rel="noreferrer">Open the video in a new tab <span aria-hidden="true">↗</span></a></p>
        </section>

        <section className={s.metabolicBand} data-home-reveal>
          <div className={`${s.section} ${s.metabolicFocus}`}>
            <div className={s.metabolicIntro}>
              <p className={s.eyebrow}>A FOCUSED 12-WEEK PATH</p>
              <h2>Improve fatty liver.<br /><em>Keep the chai.</em></h2>
              <p>A personalised programme combining <strong>Ayurveda + functional nutrition</strong> to account for South Asian bodies, Indian eating patterns and life in the US &amp; Canada.</p>
              <Link href="/programmes/weight-metabolic" className={s.textLink}>Explore metabolic health <span aria-hidden="true">↗</span></Link>
            </div>
            <div className={s.metabolicCard}>
              <p className={s.eyebrow}>THIS MAY BE FOR YOU IF…</p>
              <ul>{metabolicSignals.map(signal => <li key={signal}><span aria-hidden="true">✓</span>{signal}</li>)}</ul>
              <p className={s.metabolicNote}>The work looks at the bigger metabolic picture, not one concern in isolation.</p>
            </div>
          </div>
        </section>

        <section id="about-deepti" className={s.about}>
          <div className={`${s.section} ${s.aboutGrid}`}>
            <div className={s.aboutPortrait}>
              <Image src="/deepti.webp" alt="Deepti Sherawat, nutritionist" width={768} height={1152} sizes="(max-width: 900px) calc(100vw - 48px), 34vw" className={s.aboutPortraitImage} />
              <div className={s.aboutPortraitCaption}><span>DEEPTI SHERAWAT</span><small>Ayurveda · Functional nutrition</small></div>
            </div>
            <div data-home-reveal><p className={s.eyebrow}>YOUR NUTRITIONIST</p><h2>Where Ayurveda meets<br /><em>functional nutrition.</em></h2><p>For more than 10 years and 700+ client journeys worldwide, Deepti has worked at the intersection of Ayurveda, functional nutrition and metabolic health.</p><p>Her approach looks at digestion, food patterns, lifestyle, body type and health markers—especially when Indian eating habits meet the realities of modern life abroad.</p><ul className={s.aboutValues} aria-label="What guides the conversation"><li><span>01</span>Digestion &amp; rhythm</li><li><span>02</span>Food patterns</li><li><span>03</span>Health markers</li></ul><Link href="/consultation" className={s.aboutButton}>Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link></div>
          </div>
        </section>

        <section id="programmes" className={s.programmes} ref={programmeSection}>
          <div className={s.section}>
            <div className={s.sectionHead} data-home-reveal><div><p className={s.eyebrow}>FOUR PATHS. ONE PERSONAL APPROACH.</p><h2>What brings<br /><em>you here?</em></h2></div><p>Begin with what matters to you. Explore the programmes, then talk through the right starting point together.</p></div>
            <div className={s.programmeStory}>
              <div className={s.programmeStorySticky}>
                <div className={s.tabs} role="tablist" aria-label="Explore nutrition programmes">
                  {programmeData.map((item, index) => <button key={item.slug} ref={el => { tabs.current[index] = el; }} type="button" role="tab" id={`programme-tab-${index}`} aria-controls="programme-panel" aria-selected={active === index} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => {
                    let next = index;
                    if (event.key === "ArrowRight") next = (index + 1) % 4;
                    else if (event.key === "ArrowLeft") next = (index + 3) % 4;
                    else if (event.key === "Home") next = 0;
                    else if (event.key === "End") next = 3;
                    else return;
                    event.preventDefault(); setActive(next); tabs.current[next]?.focus();
                  }}><small>{item.number}</small>{item.title}</button>)}
                </div>
                <div key={programme.slug} id="programme-panel" role="tabpanel" aria-labelledby={`programme-tab-${active}`} tabIndex={0} className={s.programmePanel}>
                  <div className={s.programmePhoto}><HomePhoto src={images[active]} alt={`Illustrative whole foods for the ${programme.title} programme`} sizes="(max-width: 900px) calc(100vw - 40px), (max-width: 1244px) calc(50vw - 32px), 590px" /></div>
                  <div className={s.programmeTextGrid}>{programmeData.map((item, index) => <div key={item.slug} className={`${s.programmeCopy} ${active !== index ? s.inactiveProgramme : ""}`} aria-hidden={active !== index} inert={active !== index}><p className={s.eyebrow}>{item.eyebrow}</p><h3>{item.title}</h3><p>{item.description}</p><ul>{item.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul><Link href={`/programmes/${item.slug}`} className={s.programmeLink}>Explore {item.shortTitle} <span aria-hidden="true">↗</span></Link></div>)}</div>
                </div>
              </div>
              <div className={s.programmeStorySteps} aria-hidden="true">
                {programmeData.map((item, index) => <div key={item.slug} ref={el => { programmeSteps.current[index] = el; }} data-programme-step={index} className={s.programmeStoryStep} style={{ top: `${index * 70}vh` }} />)}
              </div>
            </div>
            <p className={s.programmeHelp}>Unsure which path is right? <Link href="/consultation">Start with a conversation ↗</Link></p>
          </div>
        </section>

        <section id="how-it-works" className={`${s.section} ${s.journey}`}>
          <div data-home-reveal><p className={s.eyebrow}>A LITTLE CLARITY, AT EVERY STEP</p><h2>A journey that<br /><em>moves with you.</em></h2><p>From the first conversation to the small choices that become part of your day.</p><span className={s.journeyNote}>Understand → Practise → Reflect</span></div>
          <div>{steps.map(([title, description], index) => <div className={s.step} key={title}><h3><button type="button" aria-expanded={step === index} aria-controls={`step-${index}`} onClick={() => setStep(step === index ? null : index)}><small>0{index + 1}</small>{title}<span aria-hidden="true">{step === index ? "−" : "+"}</span></button></h3><div id={`step-${index}`} hidden={step !== index}><p>{description}</p></div></div>)}</div>
        </section>


        <section className={`${s.section} ${s.faq}`}><div><p className={s.eyebrow}>BEFORE WE BEGIN</p><h2>A few things<br /><em>you may wonder.</em></h2></div><div>{questions.map(([question, answer]) => <details className={s.question} key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

        <section className={s.close} data-home-reveal><div className={s.section}><p className={s.eyebrow}>ONE CONVERSATION. A THOUGHTFUL BEGINNING.</p><h2>Let’s begin<br /><em>with you.</em></h2><p>Bring your questions. We’ll explore the next step together.</p><Link href="/consultation" className={s.button}>Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link><p className={s.bookingNote}>Consultation options and fees are shown before you book.</p></div></section>
      </main>
      <MarketingFooter />
      <div className={s.mobileBooking}><Link href="/consultation">Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link></div>
    </div>
  );
}
