import type { Metadata } from "next";
import "./globals.css";
import "./marketing-motion.css";
import EntryLoader from "./components/entry-loader";
import LeadQuizGate from "./components/lead-quiz-gate";

export const metadata: Metadata = {
  title: "Deepti Sherawat | Ayurvedic & Functional Nutrition",
  description:
    "Private, nutritionist-led programmes rooted in Ayurveda and informed by modern nutrition science.",
  icons: {
    icon: "/deepa-chakra-small.svg",
    shortcut: "/deepa-chakra-small.svg",
    apple: "/deepa-chakra-small.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <EntryLoader />
        {children}
        <LeadQuizGate />
      </body>
    </html>
  );
}
