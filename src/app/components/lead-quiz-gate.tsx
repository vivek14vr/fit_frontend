"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import HealthGoalPopup from "./health-goal-popup";

function isQuizTrigger(target: EventTarget | null) {
  return target instanceof Element
    && (Boolean(target.closest('[data-open-lead-quiz]'))
      || target.closest('a[href="/consultation"]') !== null);
}

export default function LeadQuizGate() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isQuizTrigger(event.target)) return;
      event.preventDefault();
      setOpen(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return <HealthGoalPopup open={open} onClose={() => setOpen(false)} />;
}
