import {
  PublicPageLayout,
  SpacesPageContent,
} from "@/app/components/public-pages";

export default function SpacesPage() {
  return (
    <PublicPageLayout
      eyebrow="THE PRACTICE / प्रवेश"
      title={<>One considered place for <em>every stage of care.</em></>}
      description="Choose the space that matches your work. Your account permissions route you to the right workspace after secure sign-in."
      index="03"
    >
      <SpacesPageContent />
    </PublicPageLayout>
  );
}
