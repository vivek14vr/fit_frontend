export const testimonialCategoryOptions = [
  { value: "gut", label: "Gut" },
  { value: "liver", label: "Liver" },
  { value: "weight-metabolic", label: "Weight & Metabolic" },
  { value: "skin", label: "Skin" },
  { value: "hormones-thyroid", label: "Hormones & Thyroid" },
  { value: "mood-focus", label: "Mood & Focus" },
] as const;

export type TestimonialCategory = (typeof testimonialCategoryOptions)[number]["value"];

export const testimonialPlacementOptions = [
  { value: "homepage", label: "Homepage carousel" },
  { value: "slides", label: "Programme slides" },
  { value: "testimonials", label: "Testimonials page" },
] as const;

export type TestimonialPlacement = (typeof testimonialPlacementOptions)[number]["value"];

export function testimonialCategoryLabel(category: TestimonialCategory | string) {
  return testimonialCategoryOptions.find((option) => option.value === category)?.label ?? category;
}
