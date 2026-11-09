import { NutritionistReviewInstancesContent } from "@/app/components/form-instances";

type NutritionistReviewsPageProps = {
  searchParams: Promise<{
    view?: string;
    instanceId?: string;
  }>;
};

export default async function NutritionistReviewsPage({ searchParams }: NutritionistReviewsPageProps) {
  const params = await searchParams;
  return (
    <NutritionistReviewInstancesContent
      view={params.view === "reviewed" ? "reviewed" : "queue"}
      initialInstanceId={params.instanceId}
    />
  );
}
