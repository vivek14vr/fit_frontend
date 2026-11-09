"use client";

import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";
import { useModalAccessibility } from "@/app/components/use-modal-accessibility";
import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { apiUrl, fetchWithAuth } from "@/app/lib/auth-client";
import { PaginationControls } from "@/app/components/pagination-controls";

type QuestionType = "text" | "number" | "scale" | "options" | "yes_no" | "date";

type InstanceQuestion = {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  helpText?: string;
  unit?: string;
  options?: string[];
  repeatPerDay?: number;
};

type FormInstance = {
  id: string;
  templateId: string;
  templateName: string;
  questions: InstanceQuestion[];
  status: "assigned" | "in_progress" | "submitted" | "under_review" | "reviewed";
  assignedAt: string;
  dueAt: string;
  planValidityDays: number;
  formFillingDays: number;
  planValidUntil: string;
  adminNotes?: string | null;
  nutritionistNotes?: string | null;
  user?: { id: string; name: string; email: string } | null;
  nutritionist?: { id: string; name: string; email: string } | null;
  questionCount?: number;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type InstanceQuestionDraft = {
  label: string;
  type: QuestionType;
  required: boolean;
  unit: string;
  options: string;
  repeatPerDay: string;
};

const questionTypes: Array<{ value: QuestionType; label: string }> = [
  { value: "text", label: "Short answer" },
  { value: "number", label: "Number" },
  { value: "scale", label: "Scale 1–10" },
  { value: "options", label: "Multiple choice" },
  { value: "yes_no", label: "Yes / No" },
  { value: "date", label: "Date" },
];

function emptyQuestion(): InstanceQuestionDraft {
  return { label: "", type: "text", required: true, unit: "", options: "", repeatPerDay: "1" };
}

function getErrorMessage(body: { message?: string | string[] } | null, fallback: string) {
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message || fallback;
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function statusLabel(value: FormInstance["status"]) {
  return value.replaceAll("_", " ");
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

export default function AdminInstancesPage() {
  const [instances, setInstances] = useState<FormInstance[]>([]);
  const [totalInstances, setTotalInstances] = useState(0);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<FormInstance | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [planValidityDays, setPlanValidityDays] = useState("30");
  const [formFillingDays, setFormFillingDays] = useState("30");
  const [question, setQuestion] = useState<InstanceQuestionDraft>(emptyQuestion);
  const [isSaving, setIsSaving] = useState(false);
  const [isAppending, setIsAppending] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const instanceRequestRef = useRef<AbortController | null>(null);
  const isInstanceDirty = Boolean(
    selected && (
      adminNotes !== (selected.adminNotes ?? "") ||
      planValidityDays !== String(selected.planValidityDays ?? 30) ||
      formFillingDays !== String(selected.formFillingDays ?? 30) ||
      question.label.trim() ||
      question.unit.trim() ||
      question.options.trim() ||
      question.repeatPerDay !== "1" ||
      question.type !== "text" ||
      !question.required
    ),
  );
  const requestModalClose = () => {
    if (isSaving || isAppending) return;
    if (isInstanceDirty) {
      setIsDiscardConfirmOpen(true);
      return;
    }
    instanceRequestRef.current?.abort();
    instanceRequestRef.current = null;
    setSelected(null);
  };
  const modalRef = useModalAccessibility(
    Boolean(selected) && !isDiscardConfirmOpen,
    requestModalClose,
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({ page: String(page), limit: "20" });
        if (search.trim()) query.set("search", search.trim());
        const response = await fetchWithAuth(`${apiUrl}/admin/instances?${query.toString()}`, { signal: controller.signal });
        const body = (await response.json().catch(() => null)) as
          | { instances?: FormInstance[]; meta?: PaginationMeta; message?: string | string[] }
          | null;
        if (!response.ok || !body?.instances) throw new Error(getErrorMessage(body, "Unable to load assigned forms."));
        if (!cancelled) {
          setInstances(body.instances);
          setTotalInstances(body.meta?.total ?? body.instances.length);
          setPagination(body.meta ?? {
            total: body.instances.length,
            page,
            limit: 20,
            totalPages: body.instances.length > 0 ? 1 : 0,
          });
        }
      } catch (requestError) {
        if (!cancelled && !controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : "Unable to load assigned forms.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);
    return () => { cancelled = true; window.clearTimeout(timer); controller.abort(); };
  }, [page, search]);

  async function openInstance(instanceId: string) {
    instanceRequestRef.current?.abort();
    const controller = new AbortController();
    instanceRequestRef.current = controller;
    setError("");
    try {
      const response = await fetchWithAuth(`${apiUrl}/admin/instances/${instanceId}`, { signal: controller.signal });
      const body = (await response.json().catch(() => null)) as
        | { instance?: FormInstance; message?: string | string[] }
        | null;
      if (!response.ok || !body?.instance) throw new Error(getErrorMessage(body, "Unable to load this form instance."));
      if (controller.signal.aborted || instanceRequestRef.current !== controller) return;
      setSelected(body.instance);
      setIsDiscardConfirmOpen(false);
      setAdminNotes(body.instance.adminNotes ?? "");
      setPlanValidityDays(String(body.instance.planValidityDays ?? 30));
      setFormFillingDays(String(body.instance.formFillingDays ?? 30));
      setQuestion(emptyQuestion());
    } catch (requestError) {
      if (controller.signal.aborted || instanceRequestRef.current !== controller) return;
      setError(requestError instanceof Error ? requestError.message : "Unable to load this form instance.");
    } finally {
      if (instanceRequestRef.current === controller) instanceRequestRef.current = null;
    }
  }

  async function saveInstance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setIsSaving(true);
    setError("");
    try {
      const response = await fetchWithAuth(`${apiUrl}/admin/instances/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminNotes,
          planValidityDays: Number(planValidityDays),
          formFillingDays: Number(formFillingDays),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { instance?: FormInstance; message?: string | string[] }
        | null;
      if (!response.ok || !body?.instance) throw new Error(getErrorMessage(body, "Unable to save this instance."));
      setSelected((current) => current ? { ...current, ...body.instance } : body.instance ?? null);
      setPlanValidityDays(String(body.instance.planValidityDays ?? planValidityDays));
      setFormFillingDays(String(body.instance.formFillingDays ?? formFillingDays));
      setInstances((current) => current.map((item) => item.id === selected.id ? { ...item, ...body.instance } : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save this instance.");
    } finally {
      setIsSaving(false);
    }
  }

  async function appendQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setIsAppending(true);
    setError("");
    try {
      const options = question.options.split(",").map((option) => option.trim()).filter(Boolean);
      const response = await fetchWithAuth(`${apiUrl}/admin/instances/${selected.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: [{ label: question.label, type: question.type, required: question.required, unit: question.unit, options, repeatPerDay: Number(question.repeatPerDay) || 1 }],
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { instance?: FormInstance; message?: string | string[] }
        | null;
      if (!response.ok || !body?.instance) throw new Error(getErrorMessage(body, "Unable to add this question."));
      setSelected(body.instance);
      setInstances((current) => current.map((item) => item.id === body.instance?.id
        ? { ...item, questionCount: body.instance.questions.length }
        : item));
      setQuestion(emptyQuestion());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to add this question.");
    } finally {
      setIsAppending(false);
    }
  }

  return (
    <>
      <div className="admin-users-content">
        <p className="dashboard-eyebrow">CARE PROGRAMMES / ASSIGNED FORMS</p>
        <div className="dashboard-heading-row users-page-heading">
          <div><h1>Assigned forms</h1><p className="dashboard-description">Review every user-specific form instance. Existing questions stay fixed; new questions can be appended when care evolves.</p></div>
        </div>
        {error && !selected && <p className="users-feedback users-feedback-error" role="alert">{error}</p>}
        <article className="users-card users-roster-card">
          <div className="users-roster-toolbar"><div><p className="dashboard-panel-label">INSTANCE DIRECTORY</p><h2>User form instances</h2></div><span>{totalInstances} total</span></div>
          <label className="users-search" htmlFor="instance-search"><span>Search by user or form</span><input id="instance-search" type="search" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} /></label>
          {isLoading ? <p className="users-empty">Loading assigned forms…</p> : instances.length === 0 ? <p className="users-empty">No form instances have been assigned yet.</p> : (
            <div className="users-table-wrap"><table className="users-table users-instances-table"><thead><tr><th scope="col">User</th><th scope="col">Form</th><th scope="col">Nutritionist</th><th scope="col">Status</th><th scope="col">Filling due</th><th scope="col">Plan valid until</th><th scope="col">Questions</th></tr></thead><tbody>
              {instances.map((instance) => <tr key={instance.id} role="button" aria-label={`Open ${instance.templateName} for ${instance.user?.name ?? "unknown user"}`} onClick={() => void openInstance(instance.id)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void openInstance(instance.id); } }}><th scope="row">{instance.user?.name ?? "Unknown user"}<small>{instance.user?.email}</small></th><td>{instance.templateName}</td><td>{instance.nutritionist?.name ?? "Not assigned"}</td><td><span className={`users-plan-status instance-status-${instance.status}`}>{statusLabel(instance.status)}</span></td><td>{formatDate(instance.dueAt)}</td><td>{formatDate(instance.planValidUntil)}</td><td>{instance.questionCount ?? instance.questions.length}</td></tr>)}
            </tbody></table></div>
          )}
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            isLoading={isLoading}
            onPageChange={setPage}
          />
        </article>
      </div>

      {selected && <div className="users-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) requestModalClose(); }}>
        <section ref={modalRef} className="users-modal instance-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-instance-title">
          <div className="users-modal-heading"><div><p className="dashboard-panel-label">EDIT FORM INSTANCE</p><h2 id="edit-instance-title">{selected.templateName}</h2><p>{selected.user?.name} · {selected.user?.email}</p></div><button className="users-modal-close" type="button" onClick={requestModalClose} aria-label="Close instance dialog">×</button></div>
          {error && <p className="users-feedback users-feedback-error" role="alert">{error}</p>}
          <div className="instance-review-answers"><p className="dashboard-panel-label">CURRENT QUESTIONS · {selected.questions.length}</p>{selected.questions.map((item, index) => <div className="instance-existing-question" key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.label}</strong><small>{item.type}{item.unit ? ` · ${item.unit}` : ""}{item.repeatPerDay && item.repeatPerDay > 1 ? ` · ${item.repeatPerDay}× daily` : ""}{item.required ? " · required" : ""}</small></div></div>)}</div>
          <form className="users-form" onSubmit={saveInstance}><div className="plan-question-fields-row plan-duration-fields-row"><div className="form-field"><label htmlFor="instance-validity-days">Plan validity (days)</label><input id="instance-validity-days" type="number" min={1} max={3650} value={planValidityDays} onChange={(event) => setPlanValidityDays(event.target.value)} /></div><div className="form-field"><label htmlFor="instance-filling-days">Form filling duration (days)</label><input id="instance-filling-days" type="number" min={1} max={3650} value={formFillingDays} onChange={(event) => setFormFillingDays(event.target.value)} /></div></div><p className="form-field-help">Filling due {formatDate(selected.dueAt)} · Plan valid until {formatDate(selected.planValidUntil)}</p><div className="form-field"><label htmlFor="instance-admin-notes">Admin notes</label><textarea id="instance-admin-notes" rows={3} maxLength={2000} value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} placeholder="Internal note for the care team" /></div><button className="users-submit" type="submit" disabled={isSaving}>{isSaving ? "Saving…" : "Save instance details"}<span aria-hidden="true">↗</span></button></form>
          <form className="users-form instance-append-form" onSubmit={appendQuestion}><div className="plan-builder-section-heading"><div><p className="dashboard-panel-label">ADDITIVE EDIT</p><h3>Append a new question</h3></div><span className="plan-builder-help">Existing questions cannot be removed.</span></div><div className="form-field"><label htmlFor="append-instance-question">Question</label><input id="append-instance-question" type="text" minLength={3} maxLength={160} value={question.label} onChange={(event) => setQuestion((current) => ({ ...current, label: event.target.value }))} required /></div><div className="form-field"><label htmlFor="append-instance-unit">Unit <span>(optional)</span></label><input id="append-instance-unit" type="text" maxLength={40} value={question.unit} onChange={(event) => setQuestion((current) => ({ ...current, unit: event.target.value }))} /></div><div className="form-field"><label htmlFor="append-instance-repeat">Entries per day</label><input id="append-instance-repeat" type="number" min={1} max={24} value={question.repeatPerDay} onChange={(event) => setQuestion((current) => ({ ...current, repeatPerDay: event.target.value }))} /></div><fieldset className="plan-question-type-fieldset"><legend>Answer type</legend><div className="plan-question-types instance-question-types" role="radiogroup" aria-label="Answer type">{questionTypes.map((type, index) => <button className={`plan-question-type${question.type === type.value ? " is-selected" : ""}`} type="button" role="radio" aria-checked={question.type === type.value} tabIndex={question.type === type.value || (!question.type && index === 0) ? 0 : -1} key={type.value} onKeyDown={(event) => handleRadioKeyDown(event, index, questionTypes.length)} onClick={() => setQuestion((current) => ({ ...current, type: type.value }))}>{type.label}</button>)}</div></fieldset>{question.type === "options" && <div className="form-field"><label htmlFor="append-instance-options">Choices <span>(comma separated)</span></label><input id="append-instance-options" type="text" value={question.options} onChange={(event) => setQuestion((current) => ({ ...current, options: event.target.value }))} required /></div>}<label className="plan-question-required"><input type="checkbox" checked={question.required} onChange={(event) => setQuestion((current) => ({ ...current, required: event.target.checked }))} />Required question</label><button className="users-create-button" type="submit" disabled={isAppending}>{isAppending ? "Adding…" : "Append question"}<span aria-hidden="true">＋</span></button></form>
        </section>
      </div>}
      <ConfirmDialog
        isOpen={isDiscardConfirmOpen}
        title="Leave this form instance?"
        description="Your instance notes, timing changes, or appended question will be lost if you leave now."
        confirmLabel="Discard changes"
        onCancel={() => setIsDiscardConfirmOpen(false)}
        onConfirm={() => {
          instanceRequestRef.current?.abort();
          instanceRequestRef.current = null;
          setIsDiscardConfirmOpen(false);
          setSelected(null);
          setQuestion(emptyQuestion());
        }}
      />
    </>
  );
}
