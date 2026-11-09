import type { ReactNode } from "react";
import { ProtectedPortalLayout } from "@/app/components/portal-page";

export default function NutritionistLayout({ children }: { children: ReactNode }) {
  return <ProtectedPortalLayout role="nutritionist">{children}</ProtectedPortalLayout>;
}
