import type { Metadata } from "next";
import {
  AboutPageContent,
  PublicPageLayout,
} from "@/app/components/public-pages";

export const metadata: Metadata = {
  title: "About Deepti | Ayurveda & Functional Nutrition",
  description:
    "Meet Deepti Sherawat and learn how Ayurveda, functional nutrition and modern health markers come together in her considered practice.",
};

export default function AboutPage() {
  return (
    <PublicPageLayout
      eyebrow="ABOUT DEEPTI"
      title={<>Where Ayurveda meets <em>functional nutrition.</em></>}
      description="A considered, nutritionist-led practice built around your food, your routines and the health markers that matter to you."
      index="03"
      pageClassName="about-public-page"
    >
      <AboutPageContent />
    </PublicPageLayout>
  );
}
