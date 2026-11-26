import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import ContactEnquiryForm from "./contact-enquiry-form";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";
import { programmeData } from "./marketing-data";
import s from "./public-pages.module.css";

type PublicPageLayoutProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  index: string;
  pageClassName?: string;
  hideHero?: boolean;
  children: ReactNode;
};

export function PublicPageLayout({
  eyebrow,
  title,
  description,
  index,
  pageClassName,
  hideHero = false,
  children,
}: PublicPageLayoutProps) {
  return (
    <main className={`home-page public-page ${s.page}${pageClassName ? ` ${pageClassName}` : ""}`}>
      <a className="marketing-skip-link" href="#main-content">Skip to content</a>
      <MarketingHeader />
      {!hideHero && (
        <section className="public-page-hero">
          <div className="home-shell public-page-hero-grid">
            <div>
              <p className="home-eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              <p className="home-hero-lede">{description}</p>
              <div className="home-hero-actions">
                <Link className="home-button home-button-primary" href="/consultation">
                  Book a 1:1 with Deepti <span aria-hidden="true">↗</span>
                </Link>
                <Link className="home-text-link" href="/programmes">
                  Explore programmes <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <aside className="public-page-index" aria-label="Page index">
              <div className="public-page-index-topline">
                <span>{index}</span>
                <p>THE DEEPA CHAKRA</p>
              </div>
              <strong>Considered care, held in one connected practice.</strong>
              <small>Understand · Tend · Measure</small>
            </aside>
          </div>
        </section>
      )}
      <div className="public-page-body" id="main-content">{children}</div>
      <MarketingFooter />
    </main>
  );
}

export function ApproachPageContent() {
  return (
    <>
      <section className="public-detail-section">
        <div className="home-shell public-detail-heading">
          <div>
            <p className="home-section-label">THE APPROACH</p>
            <h2>Look at the whole person.</h2>
          </div>
          <p>
            Ayurveda gives us the depth to understand the body. Functional nutrition gives us a practical way to work with it. Modern diagnostics show us what is changing.
          </p>
        </div>
        <div className="home-shell home-approach-grid approach-principles-grid public-detail-cards">
          <article className="home-feature-card home-feature-card-teal">
            <p className="home-card-kicker">01 / START WITH CONTEXT</p>
            <h3>The details matter.</h3>
            <p>Your history, symptoms, rhythms, food and the context that makes a plan sustainable all belong in the room.</p>
          </article>
          <article className="home-feature-card home-feature-card-paper">
            <p className="home-card-kicker">02 / MAKE IT USEFUL</p>
            <h3>Small, considered changes.</h3>
            <p>We build a programme around understanding, not restriction, so it can stay useful after the first appointment.</p>
          </article>
          <article className="home-feature-card home-feature-card-sage">
            <p className="home-card-kicker">03 / REVIEW TOGETHER</p>
            <h3>Progress is a conversation.</h3>
            <p>We notice what is shifting, what feels difficult and what deserves attention next—then adjust with care.</p>
          </article>
        </div>
      </section>
      <section className="public-detail-section public-detail-section-soft">
        <div className="home-shell public-detail-heading">
          <div><p className="home-section-label">HOW THE WORK MOVES</p><h2>Clarity before complexity.</h2></div>
          <p>Every recommendation should answer a simple question: what is the next useful thing this person can actually do?</p>
        </div>
        <div className="home-shell approach-steps-grid">
          <article><span>01</span><h3>Listen</h3><p>Start with your priorities, food patterns, routines and the questions you want answered.</p></article>
          <article><span>02</span><h3>Map</h3><p>Bring together the context around digestion, energy, sleep, lifestyle and relevant health markers.</p></article>
          <article><span>03</span><h3>Practise</h3><p>Choose a small number of realistic food and lifestyle experiments to try in your own week.</p></article>
          <article><span>04</span><h3>Reflect</h3><p>Review what you noticed, keep what helps and decide the next useful step together.</p></article>
        </div>
      </section>
      <section className="public-detail-section approach-editorial-section">
        <div className="home-shell approach-editorial-grid">
          <div>
            <p className="home-section-label">THE DAILY PRACTICE</p>
            <h2>Make the next meal feel less complicated.</h2>
            <p>We look for the useful detail: how you shop, what you cook, where your energy dips and which routines are already helping.</p>
            <p>From there, guidance can become a rhythm you can return to—not another set of rules to perform perfectly.</p>
          </div>
          <figure className="approach-editorial-image">
            <Image src="/editorial/approach-cooking.jpg" alt="Fresh ingredients arranged on a chopping board ready to cook" width={1600} height={1600} sizes="(max-width: 900px) calc(100vw - 40px), 42vw" />
            <figcaption>Simple ingredients. A more considered rhythm.</figcaption>
          </figure>
        </div>
      </section>
      <section className="public-detail-section approach-boundaries-section">
        <div className="home-shell public-detail-heading">
          <div><p className="home-section-label">THE BOUNDARIES</p><h2>Support that knows its place.</h2></div>
          <p>Nutrition education can sit alongside your existing care. It should add context and confidence without replacing diagnosis, treatment or advice from your medical team.</p>
        </div>
        <div className="home-shell approach-boundaries-grid public-detail-cards">
          <article className="home-feature-card home-feature-card-paper"><p className="home-card-kicker">EDUCATION</p><h3>Understand what you can act on.</h3><p>We translate nutrition concepts into practical choices, with language you can take into everyday life.</p></article>
          <article className="home-feature-card home-feature-card-teal"><p className="home-card-kicker">COLLABORATION</p><h3>Keep your medical team close.</h3><p>Share relevant reports and advice so nutrition guidance can respect the care you already have in place.</p></article>
        </div>
      </section>
      <section className="public-detail-section public-detail-section-soft approach-cta-section">
        <div className="home-shell public-detail-heading">
          <div><p className="home-section-label">A GOOD PLACE TO BEGIN</p><h2>Bring the questions that are on your mind.</h2></div>
          <div><p>A first conversation gives us time to understand your priorities and decide whether the practice is the right fit.</p><Link className="home-button home-button-primary" href="/consultation">Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link></div>
        </div>
      </section>
    </>
  );
}

export function AboutPageContent() {
  return (
    <>
      <section className="public-detail-section">
        <div className="home-shell about-page-grid">
          <div className="about-page-portrait">
            <Image src="/deepti.webp" alt="Deepti Sherawat, nutritionist" width={768} height={1152} sizes="(max-width: 900px) calc(100vw - 40px), 38vw" />
            <span>DEEPTI SHERAWAT · NUTRITIONIST</span>
          </div>
          <div className="about-page-copy">
            <p className="home-section-label">YOUR NUTRITIONIST</p>
            <h2>Where Ayurveda meets <em>functional nutrition.</em></h2>
            <p>For more than 10 years and 700+ client journeys worldwide, Deepti has worked at the intersection of Ayurveda, functional nutrition and metabolic health.</p>
            <p>Her approach looks at digestion, food patterns, lifestyle, body type and health markers—especially when Indian eating habits meet the realities of modern life abroad.</p>
            <p>The work is intentionally personal: understand what is happening, find the smallest useful experiment, then make space to learn from it.</p>
            <Link className="home-button home-button-primary" href="/consultation">Start with a conversation <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
      <section className="public-detail-section public-detail-section-soft">
        <div className="home-shell public-detail-heading">
          <div><p className="home-section-label">THE PRACTICE</p><h2>A considered practice for real life.</h2></div>
          <p>Ayurvedic principles and functional nutrition come together in a plan shaped around your food, your routines and the markers that matter to you—not an idealised version of your day.</p>
        </div>
        <div className="home-shell about-practice-grid public-detail-cards">
          <article className="home-feature-card home-feature-card-teal">
            <p className="home-card-kicker">01 / CONTEXT FIRST</p>
            <h3>The whole picture belongs in the room.</h3>
            <p>Your history, food culture, routines, symptoms and relevant health markers help shape the questions we ask together.</p>
          </article>
          <article className="home-feature-card home-feature-card-paper">
            <p className="home-card-kicker">02 / PRACTICAL BY DESIGN</p>
            <h3>Small steps can still be meaningful.</h3>
            <p>Guidance should feel clear enough to try on an ordinary week, with room for preferences, travel, family and change.</p>
          </article>
          <article className="home-feature-card home-feature-card-sage">
            <p className="home-card-kicker">03 / REVIEW TOGETHER</p>
            <h3>Notice, learn, adjust.</h3>
            <p>Progress is a conversation. We pay attention to what feels useful and decide what deserves more attention next.</p>
          </article>
        </div>
      </section>
      <section className="public-detail-section about-editorial-section">
        <div className="home-shell about-editorial-grid">
          <figure className="about-editorial-image">
            <Image src="/editorial/about-food.jpg" alt="A nourishing meal arranged with herbs and colourful ingredients" width={1600} height={1067} sizes="(max-width: 900px) calc(100vw - 40px), 52vw" />
            <figcaption>Food, context and the everyday rhythm around it.</figcaption>
          </figure>
          <div>
            <p className="home-section-label">THE EVERYDAY PRACTICE</p>
            <h2>Good guidance has to meet you where life happens.</h2>
            <p>That might mean a familiar family meal, a busy work week, travel between two homes or a health report that has left you with more questions than answers.</p>
            <p>The aim is not to make your life smaller. It is to help you understand the patterns around food and wellbeing so your next choice feels more informed and more yours.</p>
          </div>
        </div>
      </section>
      <section className="public-detail-section about-principles-section">
        <div className="home-shell public-detail-heading">
          <div><p className="home-section-label">WHAT GUIDES THE WORK</p><h2>Care with a point of view.</h2></div>
          <p>These principles keep the practice warm, evidence-informed and grounded in the person sitting across from us.</p>
        </div>
        <div className="home-shell about-principles-grid">
          <article><span>01</span><h3>Curiosity</h3><p>Ask better questions before reaching for a recommendation.</p></article>
          <article><span>02</span><h3>Context</h3><p>Respect the food, routines and culture that make your life yours.</p></article>
          <article><span>03</span><h3>Clarity</h3><p>Translate complexity into a next step you can understand.</p></article>
          <article><span>04</span><h3>Partnership</h3><p>Keep the process collaborative, reflective and kind.</p></article>
        </div>
      </section>
      <section className="public-detail-section public-detail-section-soft about-cta-section">
        <div className="home-shell public-detail-heading">
          <div><p className="home-section-label">A GOOD PLACE TO BEGIN</p><h2>You do not need all the answers first.</h2></div>
          <div><p>Bring the questions you have, the patterns you have noticed and the parts that feel difficult to untangle. The first conversation is where we find the right starting point.</p><Link className="home-button home-button-primary" href="/consultation">Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link></div>
        </div>
      </section>
    </>
  );
}

export function TestimonialsPageContent() {
  return (
    <>
      <section className="public-detail-section testimonials-story-section">
        <div className="home-shell public-detail-heading">
          <div>
            <p className="home-section-label">CLIENT STORIES</p>
            <h2>Real experiences, shared with permission.</h2>
          </div>
          <p>Health stories are personal. This page will only publish reflections that a client has approved, with the level of identification they are comfortable sharing.</p>
        </div>
        <div className="home-shell testimonials-coming-soon" role="status">
          <div className="testimonials-coming-soon-index" aria-hidden="true">01</div>
          <div>
            <p className="home-card-kicker">STORIES IN PREPARATION</p>
            <h3>Approved client reflections will live here.</h3>
            <p>We are preparing this collection with care. No quote, name, photograph or health experience will be published without clear permission from the person behind it.</p>
          </div>
          <Link className="home-text-link" href="/consultation">Start your own conversation <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className="public-detail-section public-detail-section-soft testimonials-principles-section">
        <div className="home-shell public-detail-heading">
          <div><p className="home-section-label">HOW STORIES ARE SHARED</p><h2>Care continues after the consultation.</h2></div>
          <p>Every story should protect the person first and give future clients useful context without promising the same outcome for everyone.</p>
        </div>
        <div className="home-shell testimonials-principles-grid">
          <article><span>01</span><h3>Permission first</h3><p>The client decides whether their reflection can be published and how they are identified.</p></article>
          <article><span>02</span><h3>Privacy respected</h3><p>Personal and health details stay private unless the client has explicitly approved their use.</p></article>
          <article><span>03</span><h3>Context, not promises</h3><p>One person’s experience is never presented as a guaranteed result for somebody else.</p></article>
        </div>
      </section>

      <section className="public-detail-section testimonials-cta-section">
        <div className="home-shell public-detail-heading">
          <div><p className="home-section-label">YOUR STARTING POINT</p><h2>Your questions deserve their own conversation.</h2></div>
          <div><p>Bring what you have noticed, what feels difficult and what you would like to understand. The first conversation is where the next useful step becomes clearer.</p><Link className="home-button home-button-primary" href="/consultation">Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link></div>
        </div>
      </section>
    </>
  );
}

export function ProgrammesPageContent() {
  return (
    <section className="public-detail-section">
      <div className="home-shell public-detail-heading">
        <div><p className="home-section-label">THE METHOD / दीपन DĪPANA</p><h2>Six paths, one personal approach.</h2></div>
        <p>Choose the concern that brought you here. Every programme begins with context, becomes practical through small experiments, and is reviewed with you over time.</p>
      </div>
      <div className="home-shell programme-landing-grid">
        {programmeData.map((programme) => (
          <article className={`programme-landing-card programme-landing-card-${programme.colour}`} key={programme.slug}>
            <div className="programme-landing-image">
              <Image src={programme.image} alt={`Fresh food for the ${programme.title} programme`} fill sizes="(max-width: 700px) calc(100vw - 40px), 50vw" />
            </div>
            <div className="programme-landing-card-body">
              <div className="programme-landing-topline"><span>{programme.number}</span><Link href={`/programmes/${programme.slug}`} aria-label={`Explore ${programme.title}`}>↗</Link></div>
              <p className="home-card-kicker">{programme.eyebrow}</p>
              <h3>{programme.title}</h3>
              <p>{programme.description}</p>
              <ul>{programme.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
              <Link className="home-text-link" href={`/programmes/${programme.slug}`}>Explore {programme.shortTitle} <span aria-hidden="true">↗</span></Link>
            </div>
          </article>
        ))}
      </div>
      <div className="home-shell programme-landing-note">
        <p className="home-section-label">A CLEARER STARTING POINT</p>
        <p>You do not need to choose perfectly before you begin. A 1:1 consultation gives us space to understand your history and decide which path, if any, makes sense for you.</p>
        <Link className="home-button home-button-primary" href="/consultation">Start with a conversation <span aria-hidden="true">↗</span></Link>
      </div>
      <section className="public-detail-section public-detail-section-soft programme-landing-process">
        <div className="home-shell public-detail-heading">
          <div><p className="home-section-label">HOW THE WORK MOVES</p><h2>From understanding to useful action.</h2></div>
          <p>The programme is not a rigid meal plan. It is a shared process that turns your priorities into choices you can understand, test and keep.</p>
        </div>
        <div className="home-shell programme-process-grid">
          <article><span>01</span><h3>Understand</h3><p>Bring your history, food patterns, routines and relevant reports into one considered picture.</p></article>
          <article><span>02</span><h3>Tend</h3><p>Choose a few practical changes that respect your culture, preferences, energy and everyday life.</p></article>
          <article><span>03</span><h3>Measure</h3><p>Notice what is shifting and review the next useful step together, without chasing quick fixes.</p></article>
        </div>
      </section>
    </section>
  );
}

export function ContactPageContent() {
  return (
    <section className="public-detail-section contact-form-section">
      <div className="home-shell contact-form-layout">
        <div className="contact-form-card">
          <p className="home-section-label">SEND AN ENQUIRY</p>
          <h2>Tell us what is on your mind.</h2>
          <p className="contact-form-intro">Share a little context, ask a question or tell us what you would like to understand. This form is for general enquiries and is separate from the 1:1 health check-in.</p>
          <ContactEnquiryForm />
        </div>
      </div>
    </section>
  );
}

export function SpacesPageContent() {
  return (
    <section className="public-detail-section">
      <div className="home-shell public-detail-heading">
        <div><p className="home-section-label">THE PRACTICE / प्रवेश</p><h2>Choose the space that matches your work.</h2></div>
        <p>Your account permissions are checked securely and route you to the right workspace.</p>
      </div>
      <div className="home-shell home-space-grid public-detail-cards">
        <Link className="home-space-card home-space-user" href="/user/dashboard"><div className="home-space-topline"><span>01 / USER</span><span aria-hidden="true">↗</span></div><h3>Your plan, progress and notes.</h3><p>A quiet personal space for the next useful step in your care.</p><span className="home-space-link">Open user space <span aria-hidden="true">↗</span></span></Link>
        <Link className="home-space-card home-space-nutritionist" href="/nutritionist/dashboard"><div className="home-space-topline"><span>02 / NUTRITIONIST</span><span aria-hidden="true">↗</span></div><h3>Programmes, reviews and people in care.</h3><p>A working space to guide each person with clarity.</p><span className="home-space-link">Open care workspace <span aria-hidden="true">↗</span></span></Link>
        <Link className="home-space-card home-space-admin" href="/admin"><div className="home-space-topline"><span>03 / ADMIN REGULATOR</span><span aria-hidden="true">↗</span></div><h3>Keep the practice clear and current.</h3><p>Manage access and oversee the spaces that support care.</p><span className="home-space-link">Open regulator sign in <span aria-hidden="true">↗</span></span></Link>
      </div>
    </section>
  );
}

export function ConsultationPageContent() {
  return (
    <section className="public-detail-section consultation-contact-section">
      <div className="home-shell consultation-contact-card contact-form-card">
        <p className="home-section-label">THE FIRST STEP</p>
        <h2>Start with a considered conversation.</h2>
        <p className="contact-form-intro">Answer a few questions about your goals, routines and starting point. Your details go to Deepti’s practice first, so your consultation can begin with useful context.</p>
        <div className="consultation-route-note" role="note"><span aria-hidden="true">✦</span><p><strong>Worldwide online support.</strong> People joining from outside India can choose a scheduling time after the check-in. The India payment step will be added before its scheduling link is released.</p></div>
        <button className="home-button home-button-primary consultation-start-button" type="button" data-open-lead-quiz>Start the health check-in <span aria-hidden="true">↗</span></button>
      </div>
    </section>
  );
}
