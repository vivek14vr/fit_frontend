import type { TestimonialCategory } from "./testimonial-data";

export type Programme = {
  slug: TestimonialCategory;
  number: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  description: string;
  detail: string;
  colour: "aqua" | "sand" | "coral" | "ink";
  imageClass: string;
  image: string;
  highlights: string[];
};

export const programmeData: Programme[] = [
  {
    slug: "gut",
    number: "01",
    title: "Gut",
    shortTitle: "Gut",
    eyebrow: "DIGESTION · RHYTHM · EASE",
    description:
      "For people looking to understand their digestion, food patterns and mealtime routines through personalised nutrition guidance.",
    detail:
      "We look at the patterns around food, digestion, sleep, energy and daily rhythm, then build a practical programme you can return to in real life.",
    colour: "aqua",
    imageClass: "programme-image-gut",
    image: "/programmes/gut.jpg",
    highlights: ["Personal history and food patterns", "Ayurvedic context", "Practical weekly rhythm"],
  },
  {
    slug: "liver",
    number: "02",
    title: "Liver",
    shortTitle: "Liver",
    eyebrow: "NOURISHMENT · CLARITY · CARE",
    description:
      "For people seeking nutrition and lifestyle guidance around liver wellbeing, alongside advice from their medical team.",
    detail:
      "Together we bring context to your habits, routines and existing reports, then turn that understanding into simple, repeatable choices.",
    colour: "sand",
    imageClass: "programme-image-liver",
    image: "/programmes/liver.jpg",
    highlights: ["Lifestyle and nutrition review", "Evidence-informed education", "A plan made for your pace"],
  },
  {
    slug: "weight-metabolic",
    number: "03",
    title: "Weight & Metabolic",
    shortTitle: "Weight & metabolic",
    eyebrow: "STRUCTURE · LITERACY · MOMENTUM",
    description:
      "For people seeking a sustainable approach to weight goals, appetite and everyday eating habits.",
    detail:
      "This programme makes room for your history, environment and goals, so the next steps feel clear, measurable and possible to keep.",
    colour: "coral",
    imageClass: "programme-image-metabolic",
    image: "/programmes/metabolic.jpg",
    highlights: ["Context before recommendations", "Clear food and habit experiments", "Progress reviewed together"],
  },
  {
    slug: "skin",
    number: "04",
    title: "Skin",
    shortTitle: "Skin",
    eyebrow: "FOOD · RITUAL · INNER–OUTER",
    description:
      "For people interested in exploring how food and daily routines relate to skin wellbeing, alongside their existing care.",
    detail:
      "We connect your everyday nourishment with the rhythms around it, keeping the work grounded, personal and free from quick-fix promises.",
    colour: "ink",
    imageClass: "programme-image-skin",
    image: "/programmes/skin.jpg",
    highlights: ["Food and routine context", "Ayurvedic lifestyle lens", "Personalised next steps"],
  },
  {
    slug: "hormones-thyroid",
    number: "05",
    title: "Hormones & Thyroid",
    shortTitle: "Hormones & thyroid",
    eyebrow: "RHYTHM · SUPPORT · CONTEXT",
    description:
      "For people exploring cycle changes, PCOS-related goals, thyroid questions or fertility nutrition alongside appropriate medical guidance.",
    detail:
      "We connect symptoms, routines, food patterns and existing clinical guidance, keeping the plan practical and personal rather than one-size-fits-all.",
    colour: "aqua",
    imageClass: "programme-image-hormones",
    image: "/programmes/hormone-rhythm.webp",
    highlights: ["Cycle and symptom context", "Food and routine review", "Medical guidance kept in view"],
  },
  {
    slug: "mood-focus",
    number: "06",
    title: "Mood & Focus",
    shortTitle: "Mood & focus",
    eyebrow: "ENERGY · FOCUS · RECOVERY",
    description:
      "For people navigating brain fog, low mood, stress around food or energy that does not feel steady.",
    detail:
      "We look at nourishment, sleep, stress and daily rhythm together, then choose manageable experiments that support a more settled week.",
    colour: "ink",
    imageClass: "programme-image-mood",
    image: "/programmes/mood-focus.webp",
    highlights: ["Energy and routine review", "Food, sleep and stress context", "Small steps you can revisit"],
  },
];

export function getProgramme(slug: string) {
  return programmeData.find((programme) => programme.slug === slug);
}
