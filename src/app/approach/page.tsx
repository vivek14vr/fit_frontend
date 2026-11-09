import type { Metadata } from "next";
import {
  ApproachPageContent,
  PublicPageLayout,
} from "@/app/components/public-pages";

export const metadata: Metadata = {
  title: "The Approach | Deepti Sherawat",
  description:
    "Explore Deepti Sherawat's whole-person approach to nutrition, rooted in Ayurveda and made practical through modern diagnostics.",
};

export default function ApproachPage() {
  return (
    <PublicPageLayout
      eyebrow="THE IDEA / अग्नि AGNI"
      title={<>Your body runs on a fire <em>you can tend.</em></>}
      description="A whole-person approach to nutrition, rooted in Ayurveda and made practical through modern diagnostics."
      index="01"
    >
      <ApproachPageContent />
    </PublicPageLayout>
  );
}
