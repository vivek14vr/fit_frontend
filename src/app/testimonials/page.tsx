import type { Metadata } from "next";
import {
  PublicPageLayout,
  TestimonialsPageContent,
} from "@/app/components/public-pages";

export const metadata: Metadata = {
  title: "Client Testimonials | Deepti Sherawat",
  description:
    "Read permission-approved client reflections from Deepti Sherawat's Ayurveda and functional nutrition practice.",
};

export default function TestimonialsPage() {
  return (
    <PublicPageLayout
      eyebrow="CLIENT TESTIMONIALS"
      title={<>Real journeys. <em>Shared with care.</em></>}
      description="A home for permission-approved reflections from people who have worked with Deepti. Every story remains personal; no single experience is presented as a promised outcome."
      index="05"
      pageClassName="testimonials-public-page"
    >
      <TestimonialsPageContent />
    </PublicPageLayout>
  );
}
