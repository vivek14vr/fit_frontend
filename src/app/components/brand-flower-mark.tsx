import type { CSSProperties } from "react";
import { wheelPaths } from "./service-wheel-data";

/** Geometry matches the approved header symbol; only the petal fills are animated. */
export default function BrandFlowerMark({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
    <circle cx="100" cy="100" r="84" fill="none" stroke="currentColor" strokeWidth="3" />
    {wheelPaths.map((path,index) => <path key={path.title} className="brand-flower-petal" transform={`translate(100 100) rotate(${index * 60})`} d="M0 -26 C14 -34 18 -50 0 -66 C-18 -50 -14 -34 0 -26 Z" stroke="currentColor" strokeWidth="2" fill={path.color} style={{ "--petal-delay": `${index * 100}ms` } as CSSProperties} />)}
    <path d="M100 76 C110 87 111 99 100 108 C89 99 90 87 100 76 Z" fill="#c9922e" />
    <path d="M78 114 C90 126 110 126 122 114 C110 118 90 118 78 114 Z" fill="#3f6b55" stroke="#3f6b55" strokeWidth="3" strokeLinejoin="round" />
  </svg>;
}
