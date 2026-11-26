"use client";

import { useEffect, useRef, useState } from "react";
import { useModalAccessibility } from "./use-modal-accessibility";
import BodyHealthScene from "./body-health-scene";
import { BODY_CONCERNS, type BodyConcernId } from "./body-concerns";
import s from "./human-body-explorer-modal.module.css";

type HumanBodyExplorerModalProps = {
  open: boolean;
  initialConcern?: BodyConcernId;
  onOpen: () => void;
  onClose: () => void;
  onContinue: (concern: BodyConcernId) => void;
};

export default function HumanBodyExplorerModal({ open, initialConcern, onOpen, onClose, onContinue }: HumanBodyExplorerModalProps) {
  const [activeId, setActiveId] = useState<BodyConcernId>(initialConcern ?? "gut");
  const [view, setView] = useState<"front" | "back">("front");
  const [zoom, setZoom] = useState(1);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const modalRef = useModalAccessibility(open, onClose);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }));
  }, [open]);

  const active = BODY_CONCERNS.find((concern) => concern.id === activeId) ?? BODY_CONCERNS[3];
  const ctaLabel = `Continue with ${active.shortTitle.toLowerCase()} support`;

  return (
    <>
      {!open ? (
        <button className={s.floatingTrigger} type="button" onClick={onOpen}>
          <span aria-hidden="true">✦</span>
          <span><small>NOT SURE WHERE TO BEGIN?</small>Explore your body</span>
        </button>
      ) : null}

      {open ? (
        <div className={s.backdrop} role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) onClose();
        }}>
          <section ref={modalRef} className={s.dialog} role="dialog" aria-modal="true" aria-labelledby="body-explorer-title" aria-describedby="body-explorer-note">
            <button className={s.close} type="button" onClick={onClose} aria-label="Close body explorer">×</button>

            <header className={s.header}>
              <div>
                <p className={s.kicker}>EXPLORE YOUR BODY</p>
                <h2 id="body-explorer-title" ref={titleRef} tabIndex={-1}>Select an area to explore</h2>
              </div>
              <p id="body-explorer-note">Your body concerns rarely exist in isolation. Choose a focus area to see where a thoughtful nutrition conversation can begin.</p>
            </header>

            <div className={s.explorer}>
              <nav className={s.focusNav} aria-label="Body focus areas">
                <p className={s.navLabel}>FOCUS AREAS</p>
                {BODY_CONCERNS.map((concern) => (
                  <button
                    key={concern.id}
                    type="button"
                    className={s.focusButton}
                    data-active={activeId === concern.id}
                    aria-pressed={activeId === concern.id}
                    onClick={() => setActiveId(concern.id)}
                  >
                    <span>{concern.number}</span>
                    <strong>{concern.shortTitle}</strong>
                    <small aria-hidden="true">↗</small>
                  </button>
                ))}
              </nav>

              <div className={s.mapColumn}>
                <div className={s.mapToolbar}>
                  <span>ANATOMY ATLAS</span>
                  <div className={s.mapControls}>
                    <div className={s.viewToggle} role="group" aria-label="Body view">
                      <button type="button" data-active={view === "front"} aria-pressed={view === "front"} onClick={() => setView("front")}>Front</button>
                      <button type="button" data-active={view === "back"} aria-pressed={view === "back"} onClick={() => setView("back")}>Back</button>
                    </div>
                    <div className={s.zoomControls} role="group" aria-label="Map zoom">
                      <button type="button" onClick={() => setZoom((current) => Math.max(0.86, Number((current - 0.12).toFixed(2))))} aria-label="Zoom out">−</button>
                      <button type="button" onClick={() => setZoom(1)} aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
                      <button type="button" onClick={() => setZoom((current) => Math.min(1.22, Number((current + 0.12).toFixed(2))))} aria-label="Zoom in">+</button>
                    </div>
                  </div>
                </div>

                <div className={s.mapStage} data-body-stage>
                  <div className={s.stageGlow} aria-hidden="true" />
                  <div className={s.mapFallback} role="img" aria-label="Body focus map. Use the focus areas list to explore support areas.">
                    <span aria-hidden="true">✦</span>
                    <strong>Choose a focus area</strong>
                    <small>The anatomy view will follow your selection.</small>
                  </div>
                  <BodyHealthScene activeId={activeId} view={view} zoom={zoom} modal />
                  <p className={s.mapHint}>Drag your attention through the focus list.<br />The highlighted area is your starting point.</p>
                </div>
              </div>

              <aside className={s.summary} aria-live="polite" aria-atomic="true">
                <div className={s.summaryTopline}><span>{active.number} / 06</span><small>SELECTED FOCUS</small></div>
                <h3>{active.title}</h3>
                <p>{active.description}</p>
                <div className={s.supportList}>
                  <span>Support can include</span>
                  <ul>
                    <li>Food patterns that feel realistic</li>
                    <li>Daily rhythms and routines</li>
                    <li>Context for your personal goals</li>
                  </ul>
                </div>
                <button className={s.continue} type="button" onClick={() => onContinue(active.id)}>
                  {ctaLabel} <span aria-hidden="true">↗</span>
                </button>
                <small className={s.disclaimer}>Nutrition guidance supports—not replaces—medical or mental-health care.</small>
              </aside>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
