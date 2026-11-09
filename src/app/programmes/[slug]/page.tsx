import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingFooter, MarketingHeader } from "@/app/components/marketing-chrome";
import HomePhoto from "@/app/components/home-photo";
import { getProgramme, programmeData } from "@/app/components/marketing-data";
import s from "@/app/components/public-pages.module.css";

const programmeImages: Record<string, string> = {
  gut: "/programmes/gut.jpg",
  liver: "/programmes/liver.jpg",
  "weight-metabolic": "/programmes/metabolic.jpg",
  skin: "/programmes/skin.jpg",
};

export function generateStaticParams() {
  return programmeData.map((programme) => ({ slug: programme.slug }));
}

export default async function ProgrammeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const programme = getProgramme(slug);

  if (!programme) {
    notFound();
  }

  return (
    <main className={`marketing-programme-detail ${s.page} ${s.programmeDetail}`}>
      <MarketingHeader />
      <section className={`marketing-programme-detail-hero marketing-detail-${programme.colour}`}>
        <div className="home-shell marketing-detail-hero-grid">
          <div>
            <Link className="marketing-back-link" href="/programmes">← All programmes</Link>
            <p className="marketing-eyebrow">PROGRAMME / {programme.number}</p>
            <h1>{programme.title}<em>.</em></h1>
            <p className="marketing-detail-lede">{programme.description}</p>
            <Link className="marketing-button marketing-button-primary" href="/consultation">Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link>
          </div>
          <div className={`marketing-detail-image ${programme.imageClass}`}>
            <HomePhoto src={programmeImages[programme.slug]} alt={`Fresh ingredients for the ${programme.title} programme`} sizes="(max-width: 900px) calc(100vw - 40px), 46vw" />
          </div>
        </div>
      </section>
      <section className="marketing-detail-body">
        <div className="home-shell marketing-detail-body-grid">
          <div><p className="marketing-section-kicker">A PERSONAL STARTING POINT</p><h2>Make the next step feel clear.</h2></div>
          <div><p className="marketing-detail-body-copy">{programme.detail}</p><div className="marketing-detail-highlights">{programme.highlights.map((highlight, index) => <div key={highlight}><span>0{index + 1}</span><strong>{highlight}</strong></div>)}</div></div>
        </div>
      </section>
      <section className="marketing-detail-close"><div className="home-shell"><p className="marketing-section-kicker">READY WHEN YOU ARE</p><h2>Begin with a conversation.</h2><Link className="marketing-text-arrow" href="/consultation">Book a 1:1 with Deepti <span aria-hidden="true">↗</span></Link></div></section>
      <MarketingFooter />
    </main>
  );
}
