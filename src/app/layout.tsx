import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deepti Sherawat | Ayurvedic & Functional Nutrition",
  description:
    "Private, nutritionist-led programmes rooted in Ayurveda and informed by modern nutrition science.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
