"use client";

import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useState } from "react";
import { useModalAccessibility } from "@/app/components/use-modal-accessibility";
import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { apiUrl, fetchWithAuth } from "@/app/lib/auth-client";
import { PaginationControls } from "@/app/components/pagination-controls";

type ManagedPlan = {
  id: string;
  name: string;
  description: string;
  durationDays?: number;
  validityDays?: number;
  formFillingDays?: number;
  questionCount?: number;
  questions?: PlanQuestion[];
  active: boolean;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type PlanQuestionType = "text" | "number" | "scale" | "options" | "yes_no" | "date";

type PlanQuestion = {
  id: string;
  label: string;
  type: PlanQuestionType;
  required: boolean;
  helpText: string;
  unit: string;
  options: string[];
  repeatPerDay: number;
};

type PlanForm = {
  name: string;
  description: string;
  validityDays: string;
  formFillingDays: string;
  questions: PlanQuestion[];
};

const questionTypes: Array<{ value: PlanQuestionType; label: string }> = [
  { value: "text", label: "Short answer" },
  { value: "number", label: "Number" },
  { value: "scale", label: "Scale 1–10" },
  { value: "options", label: "Multiple choice" },
  { value: "yes_no", label: "Yes / No" },
  { value: "date", label: "Date" },
];

function createQuestion(): PlanQuestion {
  return {
    id: `question-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label: "",
    type: "text",
    required: true,
    helpText: "",
    unit: "",
    options: [],
    repeatPerDay: 1,
  };
}

function createPlanForm(): PlanForm {
  return {
    name: "",
    description: "",
    validityDays: "30",
    formFillingDays: "30",
    questions: [createQuestion()],
  };
}

function getErrorMessage(body: { message?: string | string[] } | null, fallback: string) {
  if (Array.isArray(body?.message)) {
    return body.message.join(" ");
  }

  return body?.message || fallback;
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

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<ManagedPlan[]>([]);
  const [totalPlans, setTotalPlans] = useState(0);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState<PlanForm>(createPlanForm);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const isPlanFormDirty = Boolean(
    form.name.trim() ||
    form.description.trim() ||
    form.validityDays !== "30" ||
    form.formFillingDays !== "30" ||
    form.questions.some((question) => (
      question.label.trim() ||
      question.helpText.trim() ||
      question.unit.trim() ||
      question.options.length > 0 ||
      question.type !== "text" ||
      !question.required ||
      question.repeatPerDay !== 1
    )),
  );
  const requestModalClose = () => {
    if (isSubmitting) return;
    if (isPlanFormDirty) {
      setIsDiscardConfirmOpen(true);
      return;
    }
    setIsModalOpen(false);
  };
  const modalRef = useModalAccessibility(
    isModalOpen && !isDiscardConfirmOpen,
    requestModalClose,
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const query = new URLSearchParams({
          includeInactive: "true",
          page: String(page),
          limit: "20",
        });
        const normalizedSearch = searchTerm.trim();

        if (normalizedSearch) {
          query.set("search", normalizedSearch);
        }

        const response = await fetchWithAuth(
          `${apiUrl}/admin/plans?${query.toString()}`,
          { signal: controller.signal },
        );

        const body = (await response.json().catch(() => null)) as
          | { plans?: ManagedPlan[]; meta?: PaginationMeta; message?: string | string[] }
          | null;

        if (!response.ok || !body?.plans) {
          throw new Error(getErrorMessage(body, "Unable to load care plans."));
        }

        if (!cancelled) {
          setPlans(body.plans);
          setTotalPlans(body.meta?.total ?? body.plans.length);
          setPagination(body.meta ?? {
            total: body.plans.length,
            page,
            limit: 20,
            totalPages: body.plans.length > 0 ? 1 : 0,
          });
        }
      } catch (requestError) {
        if (controller.signal.aborted || cancelled) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load care plans.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, reloadKey, searchTerm]);

  async function handleCreatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (Number(form.formFillingDays) > Number(form.validityDays)) {
      setError("Form filling duration cannot exceed plan validity.");
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth(`${apiUrl}/admin/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          durationDays: Number(form.validityDays),
          validityDays: Number(form.validityDays),
          formFillingDays: Number(form.formFillingDays),
          questions: form.questions.map((question) => ({
            label: question.label,
            type: question.type,
            required: question.required,
            helpText: question.helpText,
            unit: question.unit,
            options: question.options,
            repeatPerDay: question.repeatPerDay,
          })),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { plan?: ManagedPlan; message?: string | string[] }
        | null;

      if (!response.ok || !body?.plan) {
        throw new Error(getErrorMessage(body, "Unable to create this plan."));
      }

      setReloadKey((currentKey) => currentKey + 1);
      setForm(createPlanForm());
      setIsModalOpen(false);
      setSuccess(`${body.plan.name} is now available for assignment.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create this plan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="admin-users-content">
        <p className="dashboard-eyebrow">MANAGEMENT / PLANS</p>
        <div className="dashboard-heading-row users-page-heading">
          <div>
            <h1>Plans</h1>
            <p className="dashboard-description">
              Create and manage form-based care plans that can be assigned, completed,
              and reviewed by the care team.
            </p>
          </div>
          <button
            className="users-create-button"
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setForm(createPlanForm());
              setIsDiscardConfirmOpen(false);
              setIsModalOpen(true);
            }}
          >
            Create plan <span aria-hidden="true">＋</span>
          </button>
        </div>

        {error && !isModalOpen && (
          <p className="users-feedback users-feedback-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="users-feedback users-feedback-success" role="status">
            {success}
          </p>
        )}

        <article className="users-card users-roster-card">
          <div className="users-roster-toolbar">
            <div>
              <p className="dashboard-panel-label">CARE PROGRAMMES</p>
              <h2>Care plans</h2>
            </div>
            <span>{totalPlans} total</span>
          </div>

          <label className="users-search" htmlFor="plan-search">
            <span>Search plans</span>
            <input
              id="plan-search"
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setPage(1);
                setSearchTerm(event.target.value);
              }}
              aria-label="Search plans by name or description"
            />
          </label>

          {isLoading ? (
            <p className="users-empty">Loading care plans…</p>
          ) : plans.length === 0 ? (
            <p className="users-empty">
              {searchTerm.trim()
                ? "No care plans match this search."
                : "No care plans have been created yet."}
            </p>
          ) : (
            <div className="users-table-wrap">
              <table className="users-table users-plans-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Description</th>
                    <th scope="col">Period</th>
                    <th scope="col">Questions</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id}>
                      <th scope="row">{plan.name}</th>
                      <td className="users-plan-description">{plan.description}</td>
                      <td>
                        {plan.validityDays ?? plan.durationDays
                          ? `${plan.validityDays ?? plan.durationDays}d validity · ${plan.formFillingDays ?? plan.durationDays}d filling`
                          : "Not set"}
                      </td>
                      <td>{plan.questionCount ?? plan.questions?.length ?? 0}</td>
                      <td>
                        <span
                          className={`users-plan-status ${plan.active ? "users-plan-status-active" : "users-plan-status-inactive"}`}
                        >
                          {plan.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            isLoading={isLoading}
            onPageChange={setPage}
          />
        </article>
      </div>

      {isModalOpen && (
        <div
          className="users-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              requestModalClose();
            }
          }}
        >
          <section
            ref={modalRef}
            className="users-modal plan-builder-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-plan-title"
          >
            <div className="users-modal-heading">
              <div>
                <p className="dashboard-panel-label">CREATE CARE PLAN</p>
                <h2 id="create-plan-title">Create a care plan</h2>
                <p>Set up a form programme for a user to complete over time.</p>
              </div>
              <button
                className="users-modal-close"
                type="button"
                onClick={requestModalClose}
                aria-label="Close create plan dialog"
              >
                ×
              </button>
            </div>

            <form className="users-form" onSubmit={handleCreatePlan}>
              <div className="form-field">
                <label htmlFor="new-plan-name">Plan name</label>
                <input
                  id="new-plan-name"
                  type="text"
                  autoComplete="off"
                  minLength={3}
                  maxLength={80}
                  value={form.name}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="new-plan-description">Description</label>
                <textarea
                  id="new-plan-description"
                  rows={4}
                  minLength={10}
                  maxLength={240}
                  value={form.description}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      description: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="plan-question-fields-row plan-duration-fields-row">
                <div className="form-field">
                  <label htmlFor="new-plan-validity">Plan validity (days)</label>
                  <input
                    id="new-plan-validity"
                    type="number"
                    min={1}
                    max={3650}
                    step={1}
                    value={form.validityDays}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        validityDays: event.target.value,
                      }))
                    }
                    required
                  />
                  <small className="form-field-help">How long this plan stays active for this user.</small>
                </div>
                <div className="form-field">
                  <label htmlFor="new-plan-filling-duration">Form filling duration (days)</label>
                  <input
                    id="new-plan-filling-duration"
                    type="number"
                    min={1}
                    max={3650}
                    step={1}
                    value={form.formFillingDays}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        formFillingDays: event.target.value,
                      }))
                    }
                    required
                  />
                  <small className="form-field-help">When the user should finish this form.</small>
                </div>
              </div>
              <section className="plan-builder-section" aria-labelledby="plan-questions-title">
                <div className="plan-builder-section-heading">
                  <div>
                    <p className="dashboard-panel-label">FORM QUESTIONS</p>
                    <h3 id="plan-questions-title">What should the user record?</h3>
                  </div>
                  <button
                    className="plan-add-question"
                    type="button"
                    onClick={() =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        questions: [...currentForm.questions, createQuestion()],
                      }))
                    }
                  >
                    Add question <span aria-hidden="true">＋</span>
                  </button>
                </div>

                <p className="plan-builder-help">
                  These questions become the user&apos;s nutrition check-in form. Their
                  answers can be reviewed against the plan later.
                </p>

                <div className="plan-question-list">
                  {form.questions.map((question, questionIndex) => (
                    <article className="plan-question-card" key={question.id}>
                      <div className="plan-question-card-heading">
                        <span>Question {String(questionIndex + 1).padStart(2, "0")}</span>
                        {form.questions.length > 1 && (
                          <button
                            className="plan-question-remove"
                            type="button"
                            onClick={() =>
                              setForm((currentForm) => ({
                                ...currentForm,
                                questions: currentForm.questions.filter(
                                  (item) => item.id !== question.id,
                                ),
                              }))
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="form-field">
                        <label htmlFor={`question-label-${question.id}`}>Question</label>
                        <input
                          id={`question-label-${question.id}`}
                          type="text"
                          minLength={3}
                          maxLength={160}
                          placeholder="For example: How was your energy today?"
                          value={question.label}
                          onChange={(event) =>
                            setForm((currentForm) => ({
                              ...currentForm,
                              questions: currentForm.questions.map((item) =>
                                item.id === question.id
                                  ? { ...item, label: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="form-field">
                        <label htmlFor={`question-help-${question.id}`}>
                          Guidance <span>(optional)</span>
                        </label>
                        <input
                          id={`question-help-${question.id}`}
                          type="text"
                          maxLength={240}
                          placeholder="Help the user answer consistently"
                          value={question.helpText}
                          onChange={(event) =>
                            setForm((currentForm) => ({
                              ...currentForm,
                              questions: currentForm.questions.map((item) =>
                                item.id === question.id
                                  ? { ...item, helpText: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                        />
                      </div>

                      <div className="plan-question-fields-row">
                        <div className="form-field">
                          <label htmlFor={`question-unit-${question.id}`}>
                            Unit <span>(optional)</span>
                          </label>
                          <input
                            id={`question-unit-${question.id}`}
                            type="text"
                            maxLength={40}
                            placeholder="e.g. kg, hours, cups"
                            value={question.unit}
                            onChange={(event) =>
                              setForm((currentForm) => ({
                                ...currentForm,
                                questions: currentForm.questions.map((item) =>
                                  item.id === question.id
                                    ? { ...item, unit: event.target.value }
                                    : item,
                                ),
                              }))
                            }
                          />
                        </div>
                        {question.type === "options" && (
                          <div className="form-field">
                            <label htmlFor={`question-options-${question.id}`}>
                              Choices <span>(comma separated)</span>
                            </label>
                            <input
                              id={`question-options-${question.id}`}
                              type="text"
                              placeholder="Morning, Afternoon, Evening"
                              value={question.options.join(", ")}
                              onChange={(event) =>
                                setForm((currentForm) => ({
                                  ...currentForm,
                                  questions: currentForm.questions.map((item) =>
                                    item.id === question.id
                                      ? {
                                          ...item,
                                          options: event.target.value
                                            .split(",")
                                            .map((option) => option.trim()),
                                        }
                                      : item,
                                  ),
                                }))
                              }
                              required
                            />
                          </div>
                        )}
                      </div>

                      <fieldset className="plan-question-type-fieldset">
                        <legend>Answer type</legend>
                        <div className="plan-question-types" role="radiogroup" aria-label="Answer type">
                          {questionTypes.map((questionType, index) => (
                            <button
                              className={`plan-question-type${question.type === questionType.value ? " is-selected" : ""}`}
                              key={questionType.value}
                              type="button"
                              role="radio"
                              aria-checked={question.type === questionType.value}
                              tabIndex={question.type === questionType.value || index === 0 ? 0 : -1}
                              onKeyDown={(event) => handleRadioKeyDown(event, index, questionTypes.length)}
                              onClick={() =>
                                setForm((currentForm) => ({
                                  ...currentForm,
                                  questions: currentForm.questions.map((item) =>
                                    item.id === question.id
                                      ? { ...item, type: questionType.value }
                                      : item,
                                  ),
                                }))
                              }
                            >
                              {questionType.label}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <div className="form-field plan-question-repeat-field">
                        <label htmlFor={`question-repeat-${question.id}`}>Entries per day</label>
                        <input
                          id={`question-repeat-${question.id}`}
                          type="number"
                          min={1}
                          max={24}
                          step={1}
                          value={question.repeatPerDay}
                          onChange={(event) =>
                            setForm((currentForm) => ({
                              ...currentForm,
                              questions: currentForm.questions.map((item) =>
                                item.id === question.id
                                  ? { ...item, repeatPerDay: Number(event.target.value) || 1 }
                                  : item,
                              ),
                            }))
                          }
                          required
                        />
                        <small className="form-field-help">Use 4 for four meal check-ins each day.</small>
                      </div>

                      <label className="plan-question-required">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(event) =>
                            setForm((currentForm) => ({
                              ...currentForm,
                              questions: currentForm.questions.map((item) =>
                                item.id === question.id
                                  ? { ...item, required: event.target.checked }
                                  : item,
                              ),
                            }))
                          }
                        />
                        Required question
                      </label>
                    </article>
                  ))}
                </div>
                <button
                  className="plan-add-question plan-add-question-bottom"
                  type="button"
                  onClick={() =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      questions: [...currentForm.questions, createQuestion()],
                    }))
                  }
                >
                  Add another question <span aria-hidden="true">＋</span>
                </button>
              </section>
              {error && (
                <p className="users-feedback users-feedback-error" role="alert">
                  {error}
                </p>
              )}
              <button className="users-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating plan…" : "Create plan"}
                {!isSubmitting && <span aria-hidden="true">↗</span>}
              </button>
            </form>
          </section>
        </div>
      )}
      <ConfirmDialog
        isOpen={isDiscardConfirmOpen}
        title="Leave this plan unfinished?"
        description="The template details and questions you entered will be cleared if you leave now."
        confirmLabel="Discard plan"
        onCancel={() => setIsDiscardConfirmOpen(false)}
        onConfirm={() => {
          setIsDiscardConfirmOpen(false);
          setIsModalOpen(false);
          setForm(createPlanForm());
        }}
      />
    </>
  );
}
