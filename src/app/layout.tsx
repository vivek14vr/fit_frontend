import type { Metadata } from "next";
import "./globals.css";
import "./marketing-motion.css";
import EntryLoader from "./components/entry-loader";

export const metadata: Metadata = {
  title: "Deepti Sherawat | Ayurvedic & Functional Nutrition",
  description:
    "Private, nutritionist-led programmes rooted in Ayurveda and informed by modern nutrition science.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <EntryLoader />
        {children}
      </body>
    </html>
  );
}
