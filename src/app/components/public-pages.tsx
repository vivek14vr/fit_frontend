import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import ConsultationOffer from "./consultation-offer";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";
import s from "./public-pages.module.css";

type PublicPageLayoutProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  index: string;
  pageClassName?: string;
  children: ReactNode;
};

export function PublicPageLayout({
  eyebrow,
  title,
  description,
  index,
  pageClassName,
  children,
}: PublicPageLayoutProps) {
  return (
    <main className={`home-page public-page ${s.page}${pageClassName ? ` ${pageClassName}` : ""}`}>
      <a className="marketing-skip-link" href="#main-content">Skip to content</a>
      <MarketingHeader />
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
            <span>{index}</span>
            <p>THE DEEPA CHAKRA</p>
            <strong>Considered care, held in one connected practice.</strong>
            <small>Understand · Tend · Measure</small>
          </aside>
        </div>
      </section>
      <div className="public-page-body" id="main-content">{children}</div>
      <MarketingFooter />
    </main>
  );
}

const programmeDetails = [
  {
    number: "01",
    title: "Understand",
    tag: "THE WHOLE PICTURE",
    description:
      "We begin with your history, symptoms, food patterns and lab reports — the complete picture, not a single number.",
  },
  {
    number: "02",
    title: "Tend",
    tag: "THE DAILY PRACTICE",
    description:
      "Your food becomes a practical protocol rooted in Ayurveda and shaped around the life you actually live.",
  },
  {
    number: "03",
    title: "Measure",
    tag: "THE NEXT USEFUL STEP",
    description:
      "We track the markers that matter over time, so the plan can respond to what your body is telling us.",
  },
];

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
        <div className="home-shell home-approach-grid public-detail-cards">
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
        </div>
      </section>
      <section className="public-detail-section public-detail-section-soft">
        <div className="home-shell public-detail-heading">
          <div><p className="home-section-label">THE PRACTICE</p><h2>Clarity before complexity.</h2></div>
          <p>Every recommendation should answer a simple question: what is the next useful thing this person can actually do?</p>
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
            <Link className="home-button home-button-primary" href="/consultation">Start with a conversation <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
      <section className="public-detail-section public-detail-section-soft">
        <div className="home-shell public-detail-heading">
          <div><p className="home-section-label">THE PRACTICE</p><h2>Personal to the person in front of us.</h2></div>
          <p>Ayurvedic principles and functional nutrition come together in a plan shaped around your food, your routines and the markers that matter to you.</p>
        </div>
      </section>
    </>
  );
}

export function ProgrammesPageContent() {
  return (
    <section className="public-detail-section">
      <div className="home-shell public-detail-heading">
        <div><p className="home-section-label">THE METHOD / दीपन DĪPANA</p><h2>A programme that moves with you.</h2></div>
        <p>Each phase gives the next one its meaning. The work is measured, personal and built for real life.</p>
      </div>
      <div className="home-shell home-programme-grid public-detail-cards">
        {programmeDetails.map((programme) => (
          <article className="home-programme-card" key={programme.number}>
            <div className="home-programme-topline"><span>{programme.number}</span><span aria-hidden="true">↗</span></div>
            <p className="home-card-kicker">{programme.tag}</p>
            <h3>{programme.title}</h3>
            <p>{programme.description}</p>
            <span className="home-card-rule" aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  );
}

export function ContactPageContent() {
  return (
    <>
      <section className="public-detail-section">
        <div className="home-shell public-detail-heading">
          <div><p className="home-section-label">BEGIN HERE</p><h2>A thoughtful next step.</h2></div>
          <p>Bring your questions, your history and the everyday context around your health. We will help you find the right starting point.</p>
        </div>
        <div className="home-shell contact-page-grid public-detail-cards">
          <article className="home-feature-card home-feature-card-teal">
            <p className="home-card-kicker">01 / CONSULTATION</p>
            <h3>Start with a conversation.</h3>
            <p>Book a 1:1 Health Assessment to discuss your priorities and the most useful next step.</p>
            <Link className="home-text-link home-text-link-light" href="/consultation">View consultation options <span aria-hidden="true">↗</span></Link>
          </article>
          <article className="home-feature-card home-feature-card-paper">
            <p className="home-card-kicker">02 / EMAIL</p>
            <h3>Stay in touch.</h3>
            <p>For general enquiries, email the practice and share a little context about what you are looking for.</p>
            <a className="home-text-link" href="mailto:deeptiofficialsherawat@gmail.com">Email Deepti <span aria-hidden="true">↗</span></a>
          </article>
        </div>
      </section>
      <section className="public-detail-section public-detail-section-soft">
        <div className="home-shell public-detail-heading">
          <div><p className="home-section-label">A NOTE ON CARE</p><h2>Education, not a replacement for medical advice.</h2></div>
          <p>Information shared here is educational. Continue working with your medical team for diagnosis, treatment and medication decisions.</p>
        </div>
      </section>
    </>
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
    <section className="public-detail-section">
      <div className="home-shell consultation-page-card">
        <div>
          <p className="home-section-label">THE FIRST STEP</p>
          <h2>Bring the whole picture.</h2>
        </div>
        <ConsultationOffer />
      </div>
      <div className="home-shell consultation-steps">
        <div><span>01</span><strong>Share the context</strong><p>Tell us what has been happening and what you want to understand.</p></div>
        <div><span>02</span><strong>Build the starting point</strong><p>We bring together your history, patterns and useful measurements.</p></div>
        <div><span>03</span><strong>Leave with a next step</strong><p>Your first programme should feel clear enough to begin.</p></div>
      </div>
    </section>
  );
}
