"use client";

import { useModalAccessibility } from "@/app/components/use-modal-accessibility";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const modalRef = useModalAccessibility(isOpen, onCancel);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="users-modal-backdrop confirm-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onCancel();
        }
      }}
    >
      <section
        ref={modalRef}
        className="users-modal confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <p className="dashboard-panel-label">UNSAVED CHANGES</p>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{description}</p>
        <div className="confirm-dialog-actions">
          <button className="portal-card-link-button" type="button" onClick={onCancel}>
            Keep editing
          </button>
          <button className="users-submit" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
