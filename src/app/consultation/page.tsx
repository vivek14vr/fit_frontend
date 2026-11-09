import type { Metadata } from "next";
import {
  ConsultationPageContent,
  PublicPageLayout,
} from "@/app/components/public-pages";

export const metadata: Metadata = {
  title: "Book a 1:1 Consultation | Deepti Sherawat",
  description:
    "Share a little context about your health goals, then choose a time for a considered 1:1 conversation with Deepti Sherawat.",
};

export default function ConsultationPage() {
  return (
    <PublicPageLayout
      eyebrow="THE FIRST STEP"
      title={<>Bring the <em>whole picture.</em></>}
      description="Begin with a considered assessment of your history, labs, constitution and daily life."
      index="04"
    >
      <ConsultationPageContent />
    </PublicPageLayout>
  );
}
