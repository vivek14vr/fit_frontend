"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import HealthGoalPopup from "./health-goal-popup";
import OneToOneSchedulePopup from "./one-to-one-schedule-popup";

function triggerFor(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  if (target.closest('[data-open-lead-quiz]')) return "health" as const;
  if (target.closest('[data-open-consultation-booking]') || target.closest('a[href="/consultation"]')) {
    return "consultation" as const;
  }
  return null;
}

export default function LeadQuizGate() {
  const pathname = usePathname();
  const [healthOpen, setHealthOpen] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;
    const timer = window.setTimeout(() => setHealthOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const trigger = triggerFor(event.target);
      if (!trigger) return;
      event.preventDefault();
      if (trigger === "health") setHealthOpen(true);
      else setConsultationOpen(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return <>
    <HealthGoalPopup open={healthOpen} onClose={() => setHealthOpen(false)} />
    <OneToOneSchedulePopup open={consultationOpen} onClose={() => setConsultationOpen(false)} />
  </>;
}
