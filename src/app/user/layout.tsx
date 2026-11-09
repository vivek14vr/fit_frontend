import type { ReactNode } from "react";
import { ProtectedPortalLayout } from "@/app/components/portal-page";

export default function UserLayout({ children }: { children: ReactNode }) {
  return <ProtectedPortalLayout role="user">{children}</ProtectedPortalLayout>;
}
