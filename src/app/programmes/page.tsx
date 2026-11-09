import {
  ProgrammesPageContent,
  PublicPageLayout,
} from "@/app/components/public-pages";

export default function ProgrammesPage() {
  return (
    <PublicPageLayout
      eyebrow="THE METHOD / दीपन DĪPANA"
      title={<>A programme that <em>moves with you.</em></>}
      description="Measured, personal nutrition programmes built around understanding—not restriction."
      index="02"
    >
      <ProgrammesPageContent />
    </PublicPageLayout>
  );
}
