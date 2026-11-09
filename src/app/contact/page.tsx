import type { Metadata } from "next";
import {
  ContactPageContent,
  PublicPageLayout,
} from "@/app/components/public-pages";

export const metadata: Metadata = {
  title: "Contact Deepti Sherawat",
  description:
    "Share your questions and context with Deepti's team, then choose the right booking calendar for your conversation.",
};

export default function ContactPage() {
  return (
    <PublicPageLayout
      eyebrow="CONTACT / BEGIN HERE"
      title={<>A thoughtful <em>next step.</em></>}
      description="Bring your questions, your history and the everyday context around your health. We will help you find the right starting point."
      index="05"
      hideHero
    >
      <ContactPageContent />
    </PublicPageLayout>
  );
}
