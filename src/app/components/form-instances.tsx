"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { useModalAccessibility } from "@/app/components/use-modal-accessibility";
import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { apiUrl, fetchWithAuth } from "@/app/lib/auth-client";
import { PaginationControls } from "@/app/components/pagination-controls";

type QuestionType = "text" | "number" | "scale" | "options" | "yes_no" | "date";

type FormQuestion = {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  helpText?: string;
  unit?: string;
  options?: string[];
  repeatPerDay?: number;
};

type FormAnswer = {
  questionId: string;
  value: unknown;
  entryDate?: string;
  occurrence?: number;
  answeredAt?: string;
};

type FormInstance = {
  id: string;
  templateName: string;
  questions?: FormQuestion[];
  answers?: FormAnswer[];
  status: "assigned" | "in_progress" | "submitted" | "under_review" | "reviewed";
  assignedAt: string;
  dueAt: string;
  planValidityDays?: number;
  formFillingDays?: number;
  planValidUntil?: string;
  nutritionistNotes?: string | null;
  reviewedAt?: string | null;
  user?: { id: string; name: string; email: string; archived?: boolean } | null;
  questionCount?: number;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function getErrorMessage(body: { message?: string | string[] } | null, fallback: string) {
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message || fallback;
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(status: FormInstance["status"]) {
  return status.replaceAll("_", " ");
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function answerKey(questionId: string, entryDate: string, occurrence: number) {
  return `${questionId}::${entryDate}::${occurrence}`;
}

function handleRadioKeyDown(
  event: ReactKeyboardEvent<HTMLButtonElement>,
  currentIndex: number,
  optionCount: number,
) {
  const direction = event.key === "ArrowRight" || event.key === "ArrowDown"
    ? 1
    : event.key === "ArrowLeft" || event.key === "ArrowUp"
      ? -1
      : 0;
  const nextIndex = event.key === "Home"
    ? 0
    : event.key === "End"
      ? optionCount - 1
      : (currentIndex + direction + optionCount) % optionCount;
  if (direction === 0 && event.key !== "Home" && event.key !== "End") return;
  event.preventDefault();
  const nextButton = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIndex];
  nextButton?.focus();
  nextButton?.click();
}

function answerMap(instance: FormInstance) {
  return Object.fromEntries((instance.answers ?? []).map((answer) => [
    answerKey(answer.questionId, answer.entryDate ?? todayKey(), answer.occurrence ?? 0),
    answer.value,
  ]));
}

function QuestionAnswer({
  question,
  value,
  onChange,
  readOnly = false,
  inputId,
  labelId,
}: {
  question: FormQuestion;
  value: unknown;
  onChange?: (value: unknown) => void;
  readOnly?: boolean;
  inputId?: string;
  labelId?: string;
}) {
  const stringValue = typeof value === "string" ? value : value == null ? "" : String(value);

  function handleChoiceKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
    optionCount: number,
  ) {
    if (readOnly || optionCount === 0) return;
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown"
      ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp"
        ? -1
        : 0;
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? optionCount - 1
        : (currentIndex + direction + optionCount) % optionCount;

    if (direction !== 0 || event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const nextButton = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIndex];
      nextButton?.focus();
      nextButton?.click();
    }
  }

  if (question.type === "scale") {
    return (
      <div
        className="instance-scale-options"
        id={inputId}
        role="radiogroup"
        aria-labelledby={labelId}
        aria-label={labelId ? undefined : question.label}
      >
        {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
          <button
            className={Number(value) === number ? "is-selected" : undefined}
            type="button"
            key={number}
            disabled={readOnly}
            role="radio"
            aria-checked={Number(value) === number}
            tabIndex={Number(value) === number || (value == null && number === 1) ? 0 : -1}
            onKeyDown={(event) => handleChoiceKeyDown(event, number - 1, 10)}
            onClick={() => onChange?.(number)}
          >
            {number}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "options" || question.type === "yes_no") {
    const options = question.type === "yes_no" ? ["yes", "no"] : question.options ?? [];
    return (
      <div
        className="instance-choice-options"
        id={inputId}
        role="radiogroup"
        aria-labelledby={labelId}
        aria-label={labelId ? undefined : question.label}
      >
        {options.map((option) => (
          <button
            className={stringValue === option ? "is-selected" : undefined}
            type="button"
            key={option}
            disabled={readOnly}
            role="radio"
            aria-checked={stringValue === option}
            tabIndex={stringValue === option || (!stringValue && option === options[0]) ? 0 : -1}
            onKeyDown={(event) => handleChoiceKeyDown(event, options.indexOf(option), options.length)}
            onClick={() => onChange?.(option)}
          >
            {option}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="instance-answer-input-wrap">
      <input
        id={inputId ?? `question-answer-${question.id}`}
        className="instance-answer-input"
        type={question.type === "number" ? "number" : question.type === "date" ? "date" : "text"}
        inputMode={question.type === "number" ? "decimal" : undefined}
        value={stringValue}
        readOnly={readOnly}
        placeholder={question.type === "date" ? undefined : "Write your answer"}
        onChange={(event) => {
          if (readOnly) return;
          onChange?.(
            question.type === "number"
              ? event.target.value === "" ? "" : Number(event.target.value)
              : event.target.value,
          );
        }}
      />
      {question.unit && <span className="instance-answer-unit">{question.unit}</span>}
    </div>
  );
}

function UserInstanceCard({
  instance,
  onStatusChange,
}: {
  instance: FormInstance;
  onStatusChange?: (instance: FormInstance) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => answerMap(instance));
  const [status, setStatus] = useState(instance.status);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [entryDate, setEntryDate] = useState(() => instance.answers?.[0]?.entryDate ?? todayKey());

  async function save(nextStatus: "in_progress" | "submitted") {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetchWithAuth(`${apiUrl}/user/instances/${instance.id}/responses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          // Persist only the selected day. The backend merges this day into the
          // instance snapshot, which keeps repeated daily forms small and avoids
          // replaying every historical answer on each save.
          answers: Object.entries(answers)
            .filter(([key]) => key.split("::")[1] === entryDate)
            .map(([key, value]) => {
            const [questionId, answerDate, occurrence] = key.split("::");
            return {
              questionId,
              entryDate: answerDate,
              occurrence: Number(occurrence),
              value,
            };
            }),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { instance?: FormInstance; message?: string | string[] }
        | null;
      if (!response.ok || !body?.instance) {
        throw new Error(getErrorMessage(body, "Unable to save this form."));
      }
      setStatus(body.instance.status);
      setAnswers(answerMap(body.instance));
      onStatusChange?.(body.instance);
      setSuccess(nextStatus === "submitted" ? "Submitted for nutritionist review." : "Progress saved.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save this form.");
    } finally {
      setIsSaving(false);
    }
  }

  const isLocked = status === "submitted" || status === "under_review" || status === "reviewed";

  return (
    <article className="portal-card instance-form-card">
      <div className="portal-card-heading">
        <div>
          <p className="dashboard-panel-label">FORM INSTANCE</p>
          <h2>{instance.templateName}</h2>
        </div>
        <span className={`portal-card-badge instance-status instance-status-${status}`}>{statusLabel(status)}</span>
      </div>
      <p className="instance-meta">Assigned {formatDate(instance.assignedAt)} · Fill by {formatDate(instance.dueAt)} · Plan valid until {formatDate(instance.planValidUntil)}</p>

      <div className="form-field instance-entry-date-field">
        <label htmlFor={`instance-entry-date-${instance.id}`}>{isLocked ? "View entries for date" : "Entries for date"}</label>
        <input
          id={`instance-entry-date-${instance.id}`}
          type="date"
          value={entryDate}
          onChange={(event) => setEntryDate(event.target.value)}
          aria-describedby={`instance-entry-date-help-${instance.id}`}
        />
        <small className="form-field-help" id={`instance-entry-date-help-${instance.id}`}>Choose the day you are recording. Repeated questions keep each daily entry separate.</small>
      </div>

      <div className="instance-question-list">
        {(instance.questions ?? []).map((question, index) => (
          Array.from({ length: question.repeatPerDay ?? 1 }, (_, occurrence) => {
            const currentAnswerKey = answerKey(question.id, entryDate, occurrence);
            return (
              <div className="instance-question" key={currentAnswerKey}>
                <div className="instance-question-heading">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {question.type === "scale" || question.type === "options" || question.type === "yes_no" ? (
                    <span
                      className="instance-question-label"
                      id={`question-label-${question.id}-${occurrence}`}
                    >
                      {question.label}{question.required && <strong aria-label="required">*</strong>}
                      {(question.repeatPerDay ?? 1) > 1 && <small className="instance-occurrence-label">Entry {occurrence + 1} of {question.repeatPerDay}</small>}
                    </span>
                  ) : (
                    <label htmlFor={`question-answer-${question.id}-${occurrence}`}>
                    {question.label}{question.required && <strong aria-label="required">*</strong>}
                    {(question.repeatPerDay ?? 1) > 1 && <small className="instance-occurrence-label">Entry {occurrence + 1} of {question.repeatPerDay}</small>}
                    </label>
                  )}
                </div>
                {question.helpText && <p>{question.helpText}</p>}
                <QuestionAnswer
                  question={question}
                  value={answers[currentAnswerKey]}
                  inputId={`question-answer-${question.id}-${occurrence}`}
                  labelId={`question-label-${question.id}-${occurrence}`}
                  readOnly={isLocked}
                  onChange={(value) => setAnswers((current) => ({ ...current, [currentAnswerKey]: value }))}
                />
              </div>
            );
          })
        ))}
      </div>

      {instance.nutritionistNotes && (
        <div className="instance-review-note">
          <p className="dashboard-panel-label">NUTRITIONIST NOTE</p>
          <p>{instance.nutritionistNotes}</p>
        </div>
      )}
      {error && <p className="users-feedback users-feedback-error" role="alert">{error}</p>}
      {success && <p className="users-feedback users-feedback-success" role="status">{success}</p>}
      {!isLocked && (
        <div className="instance-actions">
          <button className="portal-card-link-button" type="button" disabled={isSaving} onClick={() => void save("in_progress")}>
            {isSaving ? "Saving…" : "Save progress"}
          </button>
          <button className="users-create-button instance-submit-button" type="button" disabled={isSaving} onClick={() => void save("submitted")}>
            Submit for review <span aria-hidden="true">↗</span>
          </button>
        </div>
      )}
    </article>
  );
}

type UserFormInstancesContentProps = {
  view?: "active" | "submitted";
};

export function UserFormInstancesContent({ view = "active" }: UserFormInstancesContentProps) {
  const [instances, setInstances] = useState<FormInstance[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedInstance, setSelectedInstance] = useState<FormInstance | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadInstances() {
      try {
        const response = await fetchWithAuth(`${apiUrl}/user/instances?view=${view}&page=${page}&limit=20`, { signal: controller.signal });
        const body = (await response.json().catch(() => null)) as
          | { instances?: FormInstance[]; meta?: PaginationMeta; message?: string | string[] }
          | null;
        if (!response.ok || !body?.instances) throw new Error(getErrorMessage(body, "Unable to load your forms."));
        if (!cancelled) {
          setInstances(body.instances);
          setSelectedId(body.instances[0]?.id ?? "");
          setSelectedInstance(null);
          setIsDetailLoading(body.instances.length > 0);
          setPagination(body.meta ?? { total: body.instances.length, page, limit: 20, totalPages: body.instances.length ? 1 : 0 });
          setStatus("ready");
        }
      } catch (requestError) {
        if (!cancelled && !controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load your forms.");
          setStatus("error");
        }
      }
    }
    void loadInstances();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, view]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const controller = new AbortController();

    async function loadInstanceDetail() {
      try {
        const response = await fetchWithAuth(`${apiUrl}/user/instances/${selectedId}`, { signal: controller.signal });
        const body = (await response.json().catch(() => null)) as
          | { instance?: FormInstance; message?: string | string[] }
          | null;
        if (!response.ok || !body?.instance) throw new Error(getErrorMessage(body, "Unable to load this form."));
        if (!controller.signal.aborted) setSelectedInstance(body.instance);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load this form.");
        }
      } finally {
        if (!controller.signal.aborted) setIsDetailLoading(false);
      }
    }

    void loadInstanceDetail();
    return () => controller.abort();
  }, [selectedId]);

  const isSubmittedView = view === "submitted";

  function handleStatusChange(updatedInstance: FormInstance) {
    if (isSubmittedView) {
      setInstances((current) => current.map((instance) => (
        instance.id === updatedInstance.id ? updatedInstance : instance
      )));
      setSelectedInstance(updatedInstance);
      return;
    }

    if (updatedInstance.status === "submitted" || updatedInstance.status === "under_review" || updatedInstance.status === "reviewed") {
      const remaining = instances.filter((instance) => instance.id !== updatedInstance.id);
      setInstances(remaining);
      setSelectedId((currentSelectedId) => (
        currentSelectedId === updatedInstance.id ? remaining[0]?.id ?? "" : currentSelectedId
      ));
      setSelectedInstance(null);
      setNotice("Submitted for nutritionist review. You can follow it in Diet tracking.");
      return;
    }

    setInstances((current) => current.map((instance) => (
      instance.id === updatedInstance.id ? updatedInstance : instance
    )));
  }

  return (
    <>
      <div className="portal-heading-row">
        <div>
          <p className="dashboard-eyebrow">{isSubmittedView ? "DIET TRACKING / आहार" : "YOUR PLAN / योजना"}</p>
          <h1>{isSubmittedView ? "See your care taking shape." : "Make the next step practical."}</h1>
          <p className="dashboard-description">
            {isSubmittedView
              ? "Review forms you have submitted and the notes your nutritionist has left for your next step."
              : "Complete the forms assigned to you. Your nutritionist will review each submission and leave the next useful note."}
          </p>
        </div>
        <span className="dashboard-verified">{isSubmittedView ? `${pagination.total} submitted` : "Private by design"}</span>
      </div>
      {status === "loading" && <p className="users-empty">Loading your forms…</p>}
      {status === "error" && <p className="users-feedback users-feedback-error" role="alert">{error}</p>}
      {notice && <p className="users-feedback users-feedback-success" role="status">{notice}</p>}
      {status === "ready" && instances.length === 0 && (
        <article className="portal-card portal-empty-card">
          <p className="dashboard-panel-label">{isSubmittedView ? "NO SUBMISSIONS YET" : "NO FORMS YET"}</p>
          <h2>{isSubmittedView ? "Your submitted forms will appear here." : "Your practice will assign a form here."}</h2>
          <p className="portal-muted-copy">
            {isSubmittedView
              ? "After you submit a form for review, it will move here so you can follow your nutrition journey."
              : "Once a plan is assigned, its questions will appear in your personal space."}
          </p>
          {isSubmittedView && <Link className="portal-card-link" href="/user/plan">View active forms <span aria-hidden="true">↗</span></Link>}
        </article>
      )}
      {instances.length > 0 && (
        <>
          <div className="instance-tabs" role="tablist" aria-label={isSubmittedView ? "Submitted forms" : "Assigned forms"}>
            {instances.map((instance) => (
              <button
                className={selectedId === instance.id ? "is-selected" : undefined}
                type="button"
                role="tab"
                aria-selected={selectedId === instance.id}
                aria-controls={`form-panel-${instance.id}`}
                key={instance.id}
                onClick={() => {
                  setIsDetailLoading(true);
                  setSelectedId(instance.id);
                }}
              >
                <span>{instance.templateName}</span>
                <small>{statusLabel(instance.status)}</small>
              </button>
            ))}
          </div>
          <div id={`form-panel-${selectedId}`} role="tabpanel" aria-label={selectedInstance?.id === selectedId ? selectedInstance.templateName : "Selected form"}>
            {isDetailLoading && <p className="users-empty">Loading form…</p>}
            {selectedInstance?.id === selectedId && <UserInstanceCard key={selectedInstance.id} instance={selectedInstance} onStatusChange={handleStatusChange} />}
          </div>
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            isLoading={status === "loading"}
            onPageChange={setPage}
          />
        </>
      )}
    </>
  );
}

type NutritionistReviewInstancesContentProps = {
  view?: "queue" | "reviewed";
  initialInstanceId?: string;
};

export function NutritionistReviewInstancesContent({
  view = "queue",
  initialInstanceId,
}: NutritionistReviewInstancesContentProps) {
  const isHistoryView = view === "reviewed";
  const [instances, setInstances] = useState<FormInstance[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [selectedInstance, setSelectedInstance] = useState<FormInstance | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"under_review" | "reviewed">("reviewed");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const reviewRequestRef = useRef<AbortController | null>(null);
  const autoOpenedInstanceRef = useRef("");
  const isReviewDirty = Boolean(
    selectedInstance && (
      notes !== (selectedInstance.nutritionistNotes ?? "") ||
      reviewStatus !== (selectedInstance.status === "submitted" ? "under_review" : "reviewed")
    ),
  );
  const requestReviewClose = () => {
    if (isSaving) return;
    if (isReviewDirty) {
      setIsDiscardConfirmOpen(true);
      return;
    }
    reviewRequestRef.current?.abort();
    reviewRequestRef.current = null;
    setSelectedInstance(null);
    setIsReviewLoading(false);
  };
  const modalRef = useModalAccessibility(
    Boolean(selectedInstance) && !isDiscardConfirmOpen,
    requestReviewClose,
  );

  const loadInstances = useCallback(async (signal?: AbortSignal) => {
    try {
      const requestedStatus = isHistoryView ? "reviewed" : "submitted,under_review";
      const response = await fetchWithAuth(`${apiUrl}/nutritionist/instances?status=${requestedStatus}&page=${page}&limit=20`, { signal });
      const body = (await response.json().catch(() => null)) as
        | { instances?: FormInstance[]; meta?: PaginationMeta; message?: string | string[] }
        | null;
      if (!response.ok || !body?.instances) throw new Error(getErrorMessage(body, "Unable to load review forms."));
      setInstances(body.instances);
      setPagination(body.meta ?? {
        total: body.instances.length,
        page,
        limit: 20,
        totalPages: body.instances.length > 0 ? 1 : 0,
      });
      setStatus("ready");
      setError("");
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError(requestError instanceof Error ? requestError.message : "Unable to load review forms.");
      setStatus("error");
    }
  }, [isHistoryView, page]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadInstances(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadInstances]);

  const openReview = useCallback(async (instance: FormInstance) => {
    reviewRequestRef.current?.abort();
    const controller = new AbortController();
    reviewRequestRef.current = controller;
    setSelectedInstance({ ...instance, questions: [], answers: [] });
    setIsDiscardConfirmOpen(false);
    setReviewStatus(instance.status === "submitted" ? "under_review" : "reviewed");
    setNotes(instance.nutritionistNotes ?? "");
    setIsReviewLoading(true);

    try {
      const response = await fetchWithAuth(`${apiUrl}/nutritionist/instances/${instance.id}`, { signal: controller.signal });
      const body = (await response.json().catch(() => null)) as
        | { instance?: FormInstance; message?: string | string[] }
        | null;
      if (!response.ok || !body?.instance) throw new Error(getErrorMessage(body, "Unable to load this review."));
      if (!controller.signal.aborted && reviewRequestRef.current === controller) {
        setSelectedInstance(body.instance);
      }
    } catch (requestError) {
      if (!controller.signal.aborted && reviewRequestRef.current === controller) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load this review.");
      }
    } finally {
      if (!controller.signal.aborted && reviewRequestRef.current === controller) {
        setIsReviewLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!initialInstanceId || status !== "ready" || autoOpenedInstanceRef.current === initialInstanceId) {
      return;
    }
    const instance = instances.find((candidate) => candidate.id === initialInstanceId);
    if (!instance) {
      return;
    }
    autoOpenedInstanceRef.current = initialInstanceId;
    const timer = window.setTimeout(() => {
      void openReview(instance);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialInstanceId, instances, openReview, status]);

  async function saveReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedInstance || isReviewLoading) return;
    setIsSaving(true);
    setError("");
    try {
      const response = await fetchWithAuth(`${apiUrl}/nutritionist/instances/${selectedInstance.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: reviewStatus, notes }),
      });
      const body = (await response.json().catch(() => null)) as
        | { instance?: FormInstance; message?: string | string[] }
        | null;
      if (!response.ok || !body?.instance) throw new Error(getErrorMessage(body, "Unable to save this review."));
      reviewRequestRef.current?.abort();
      reviewRequestRef.current = null;
      setSelectedInstance(null);
      await loadInstances();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save this review.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="portal-heading-row">
        <div>
          <p className="dashboard-eyebrow">{isHistoryView ? "REVIEW HISTORY / समीक्षा" : "REVIEWS DUE / समीक्षा"}</p>
          <h1>{isHistoryView ? "Keep the thread of care visible." : "Make space for the next conversation."}</h1>
          <p className="dashboard-description">
            {isHistoryView
              ? "Return to reviewed forms, see the submitted answers, and refine the next useful note."
              : "Review submitted forms, update their status, and leave a practical note for the person in your care."}
          </p>
        </div>
        <span className="dashboard-verified">{pagination.total} {isHistoryView ? "reviewed forms" : "assigned forms"}</span>
      </div>
      <nav className="review-view-tabs" aria-label="Review views">
        <Link href="/nutritionist/reviews" aria-current={!isHistoryView ? "page" : undefined}>Needs review</Link>
        <Link href="/nutritionist/reviews?view=reviewed" aria-current={isHistoryView ? "page" : undefined}>Reviewed history</Link>
      </nav>
      {error && <p className="users-feedback users-feedback-error" role="alert">{error}</p>}
      {status === "loading" && <p className="users-empty">Loading review forms…</p>}
      {status === "ready" && instances.length === 0 && (
        <article className="portal-card portal-empty-card"><p className="dashboard-panel-label">{isHistoryView ? "NO REVIEW HISTORY YET" : "CLEAR FOR NOW"}</p><h2>{isHistoryView ? "Reviewed forms will appear here." : "No assigned forms need your attention."}</h2><p className="portal-muted-copy">{isHistoryView ? "Once you complete a review, its form and notes remain available here." : "Submitted user forms will appear here when they are ready to review."}</p></article>
      )}
      {instances.length > 0 && (
        <article className="portal-card portal-review-card">
          <div className="portal-card-heading"><div><p className="dashboard-panel-label">{isHistoryView ? "REVIEWED FORMS" : "CARE REVIEWS"}</p><h2>{isHistoryView ? "Your review history" : "Forms in your workspace"}</h2></div><span className="portal-card-badge">{pagination.total} total</span></div>
          <div className="portal-review-list">
            {instances.map((instance) => (
              <button className="portal-review-row instance-review-button" type="button" key={instance.id} onClick={() => void openReview(instance)}>
                <span className="portal-review-avatar">{instance.user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2) ?? "—"}</span>
                <span><strong>{instance.user?.name ?? "User"}</strong><small>{instance.templateName} · Due {formatDate(instance.dueAt)}</small></span>
                <span className={`portal-status-pill instance-status-${instance.status}`}>{statusLabel(instance.status)}</span>
                <span className="portal-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            isLoading={status === "loading"}
            onPageChange={setPage}
          />
        </article>
      )}

      {selectedInstance && (
        <div className="users-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) requestReviewClose(); }}>
          <section ref={modalRef} className="users-modal instance-review-modal" role="dialog" aria-modal="true" aria-labelledby="review-instance-title">
            <div className="users-modal-heading">
              <div><p className="dashboard-panel-label">REVIEW FORM</p><h2 id="review-instance-title">{selectedInstance.templateName}</h2><p>{selectedInstance.user?.name} · Due {formatDate(selectedInstance.dueAt)}</p></div>
              <button className="users-modal-close" type="button" onClick={requestReviewClose} aria-label="Close review dialog">×</button>
            </div>
            <div className="instance-review-answers">
              {isReviewLoading ? <p className="users-empty">Loading submitted answers…</p> : (selectedInstance.questions ?? []).map((question, index) => (
                <div className="instance-question" key={question.id}>
                  <div className="instance-question-heading"><span>{String(index + 1).padStart(2, "0")}</span><label>{question.label}</label></div>
                  {(selectedInstance.answers ?? []).filter((answer) => answer.questionId === question.id).length === 0 ? (
                    <p className="instance-meta">No response yet.</p>
                  ) : (
                    <div className="instance-review-answer-list">
                      {(selectedInstance.answers ?? [])
                        .filter((answer) => answer.questionId === question.id)
                        .sort((left, right) => (left.entryDate ?? "").localeCompare(right.entryDate ?? "") || (left.occurrence ?? 0) - (right.occurrence ?? 0))
                        .map((answer) => (
                          <div className="instance-review-answer" key={`${answer.questionId}-${answer.entryDate ?? "legacy"}-${answer.occurrence ?? 0}`}>
                            <small>{answer.entryDate ?? "Date not recorded"}{(question.repeatPerDay ?? 1) > 1 ? ` · Entry ${(answer.occurrence ?? 0) + 1}` : ""}</small>
                            <QuestionAnswer question={question} value={answer.value} readOnly />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <form className="users-form" onSubmit={saveReview}>
              <div className="form-field"><label htmlFor="nutritionist-review-notes">Review note</label><textarea id="nutritionist-review-notes" rows={4} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Leave the next useful step for this person" /></div>
              <div className="form-field"><span className="form-field-label" id="nutritionist-review-status-label">Update status</span><div className="instance-choice-options" role="radiogroup" aria-labelledby="nutritionist-review-status-label"><button className={reviewStatus === "under_review" ? "is-selected" : undefined} type="button" role="radio" aria-checked={reviewStatus === "under_review"} tabIndex={reviewStatus === "under_review" ? 0 : -1} onKeyDown={(event) => handleRadioKeyDown(event, 0, 2)} onClick={() => setReviewStatus("under_review")}>Under review</button><button className={reviewStatus === "reviewed" ? "is-selected" : undefined} type="button" role="radio" aria-checked={reviewStatus === "reviewed"} tabIndex={reviewStatus === "reviewed" ? 0 : -1} onKeyDown={(event) => handleRadioKeyDown(event, 1, 2)} onClick={() => setReviewStatus("reviewed")}>Reviewed</button></div></div>
              <button className="users-submit" type="submit" disabled={isSaving || isReviewLoading}>{isSaving ? "Saving review…" : "Save review"}<span aria-hidden="true">↗</span></button>
            </form>
          </section>
        </div>
      )}
      <ConfirmDialog
        isOpen={isDiscardConfirmOpen}
        title="Leave this review unfinished?"
        description="Your review note and status change will be lost if you leave now."
        confirmLabel="Discard review"
        onCancel={() => setIsDiscardConfirmOpen(false)}
        onConfirm={() => {
          reviewRequestRef.current?.abort();
          reviewRequestRef.current = null;
          setIsDiscardConfirmOpen(false);
          setSelectedInstance(null);
          setIsReviewLoading(false);
        }}
      />
    </>
  );
}
