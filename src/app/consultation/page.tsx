import {
  ConsultationPageContent,
  PublicPageLayout,
} from "@/app/components/public-pages";

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
