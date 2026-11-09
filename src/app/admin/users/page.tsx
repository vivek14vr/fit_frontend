"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { apiUrl, fetchWithAuth } from "@/app/lib/auth-client";
import { useModalAccessibility } from "@/app/components/use-modal-accessibility";
import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { PaginationControls } from "@/app/components/pagination-controls";

type UserRole = "admin" | "nutritionist" | "user";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dashboardUnlocked: boolean;
  nutritionist?: NutritionistOption | null;
  plan?: PlanOption | null;
  createdAt?: string;
};

type NutritionistOption = {
  id: string;
  name: string;
  email: string;
};

type PlanOption = {
  id: string;
  name: string;
  description: string;
  instanceId?: string;
  durationDays?: number;
  validityDays?: number;
  formFillingDays?: number;
};

type AssignmentOption = NutritionistOption | PlanOption;

type AssignmentType = "nutritionist" | "plan";

type CreateUserForm = {
  email: string;
  password: string;
  role: UserRole;
};

type AdminUsersPageProps = {
  roleFilter?: UserRole;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type AssignmentModalProps = {
  type: AssignmentType;
  userName: string;
  searchTerm: string;
  options: AssignmentOption[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string;
  planValidityDays: string;
  formFillingDays: string;
  onPlanValidityDaysChange: (value: string) => void;
  onFormFillingDaysChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSelect: (option: AssignmentOption) => void;
  onClose: () => void;
};

type RoleOption = {
  value: UserRole;
  label: string;
};

const roleLabels: Record<UserRole, string> = {
  admin: "Admin regulator",
  nutritionist: "Nutritionist",
  user: "Normal user",
};

function formatCreatedAt(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function isNutritionistOption(option: AssignmentOption): option is NutritionistOption {
  return "email" in option;
}

const roleOptions: RoleOption[] = [
  { value: "user", label: "Normal user" },
  { value: "nutritionist", label: "Nutritionist" },
  { value: "admin", label: "Admin regulator" },
];

function RoleDropdown({
  value,
  onChange,
  lockedRole,
  id,
}: {
  value: UserRole;
  onChange: (value: UserRole) => void;
  lockedRole?: UserRole;
  id: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = "new-user-role-options";
  const selectedOption = roleOptions.find((option) => option.value === value);
  const availableOptions = lockedRole
    ? roleOptions.filter((option) => option.value === lockedRole)
    : roleOptions;

  useEffect(() => {
    if (isOpen) {
      optionRefs.current[highlightedIndex]?.focus();
    }
  }, [highlightedIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="users-custom-dropdown" ref={dropdownRef}>
      <button
        id={id}
        className="users-custom-dropdown-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            return;
          }
          const selectedIndex = availableOptions.findIndex((option) => option.value === value);
          setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
          setIsOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            const selectedIndex = availableOptions.findIndex((option) => option.value === value);
            setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
            setIsOpen(true);
          }
        }}
      >
        <span>{selectedOption?.label ?? "Choose account type"}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {isOpen && (
        <div className="users-custom-dropdown-menu" id={listboxId} role="listbox" aria-label="Account type">
          {availableOptions.map((option) => (
            <button
              className={`users-custom-dropdown-option${availableOptions[highlightedIndex]?.value === option.value ? " is-highlighted" : ""}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              tabIndex={-1}
              key={option.value}
              ref={(element) => {
                optionRefs.current[availableOptions.indexOf(option)] = element;
              }}
              onKeyDown={(event) => {
                const currentIndex = availableOptions.findIndex((item) => item.value === option.value);
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  const direction = event.key === "ArrowDown" ? 1 : -1;
                  const nextIndex = (currentIndex + direction + availableOptions.length) % availableOptions.length;
                  setHighlightedIndex(nextIndex);
                  optionRefs.current[nextIndex]?.focus();
                } else if (event.key === "Home" || event.key === "End") {
                  event.preventDefault();
                  const nextIndex = event.key === "Home" ? 0 : availableOptions.length - 1;
                  setHighlightedIndex(nextIndex);
                  optionRefs.current[nextIndex]?.focus();
                } else if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentModal({
  type,
  userName,
  searchTerm,
  options,
  isLoading,
  isSubmitting,
  error,
  planValidityDays,
  formFillingDays,
  onPlanValidityDaysChange,
  onFormFillingDaysChange,
  onSearchChange,
  onSelect,
  onClose,
}: AssignmentModalProps) {
  const requestClose = () => {
    if (!isSubmitting) onClose();
  };
  const modalRef = useModalAccessibility(true, requestClose);
  const titleId = `assign-${type}-title`;

  return (
    <div
      className="users-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          requestClose();
        }
      }}
    >
      <section
        ref={modalRef}
        className="users-modal users-assignment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="users-modal-heading">
          <div>
            <p className="dashboard-panel-label">
              {type === "nutritionist" ? "ASSIGN NUTRITIONIST" : "ASSIGN PLAN"}
            </p>
            <h2 id={titleId}>
              {type === "nutritionist" ? "Choose a nutritionist" : "Choose a plan"}
            </h2>
            <p>
              {type === "nutritionist"
                ? `Choose who will guide ${userName}.`
                : `Choose the care plan for ${userName}.`}
            </p>
          </div>
          <button
            className="users-modal-close"
            type="button"
            onClick={requestClose}
            disabled={isSubmitting}
            aria-label="Close assignment dialog"
          >
            ×
          </button>
        </div>

        {type === "plan" && (
          <div className="plan-question-fields-row plan-duration-fields-row assignment-duration-fields">
            <div className="form-field">
              <label htmlFor="assignment-plan-validity">Plan validity (days)</label>
              <input
                id="assignment-plan-validity"
                type="number"
                min={1}
                max={3650}
                value={planValidityDays}
                onChange={(event) => onPlanValidityDaysChange(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="assignment-form-filling">Form filling duration (days)</label>
              <input
                id="assignment-form-filling"
                type="number"
                min={1}
                max={3650}
                value={formFillingDays}
                onChange={(event) => onFormFillingDaysChange(event.target.value)}
              />
            </div>
            <p className="form-field-help assignment-duration-help">This user-specific filling window must finish within the plan validity window.</p>
          </div>
        )}

        <label className="users-search users-assignment-search" htmlFor="assignment-search">
          <span>Search {type === "nutritionist" ? "nutritionists" : "plans"}</span>
          <input
            id="assignment-search"
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={type === "nutritionist" ? "Search by name or email" : "Search by plan name"}
            autoComplete="off"
          />
        </label>

        {error && <p className="users-feedback users-feedback-error" role="alert">{error}</p>}

        <div className="users-assignment-options" aria-live="polite">
          {isLoading ? (
            <p className="users-empty">Searching…</p>
          ) : options.length === 0 ? (
            <p className="users-empty">
              No {type === "nutritionist" ? "nutritionists" : "plans"} found.
            </p>
          ) : (
            options.map((option) => (
              <button
                className="users-assignment-option"
                type="button"
                key={option.id}
                disabled={isSubmitting}
                onClick={() => onSelect(option)}
              >
                <span className="users-assignment-option-copy">
                  <strong>{option.name}</strong>
                  <small>
                    {isNutritionistOption(option) ? option.email : option.description}
                  </small>
                </span>
                <span className="users-assignment-option-arrow" aria-hidden="true">↗</span>
              </button>
            ))
          )}
        </div>

        {isSubmitting && <p className="users-assignment-status" role="status">Saving assignment…</p>}
      </section>
    </div>
  );
}

export function AdminUsersPage({ roleFilter }: AdminUsersPageProps = {}) {
  const isNutritionistDirectory = roleFilter === "nutritionist";
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
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
  const [assignmentType, setAssignmentType] = useState<AssignmentType | null>(null);
  const [assignmentUserId, setAssignmentUserId] = useState("");
  const [assignmentUserName, setAssignmentUserName] = useState("");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentOptions, setAssignmentOptions] = useState<AssignmentOption[]>([]);
  const [isAssignmentLoading, setIsAssignmentLoading] = useState(false);
  const [isAssignmentSubmitting, setIsAssignmentSubmitting] = useState(false);
  const [accessUpdatingUserId, setAccessUpdatingUserId] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentPlanValidityDays, setAssignmentPlanValidityDays] = useState("30");
  const [assignmentFormFillingDays, setAssignmentFormFillingDays] = useState("30");
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState<CreateUserForm>({
    email: "",
    password: "",
    role: roleFilter ?? "user",
  });
  const isCreateFormDirty = Boolean(form.email.trim() || form.password.trim());
  const requestCreateModalClose = () => {
    if (isSubmitting) return;
    if (isCreateFormDirty) {
      setIsDiscardConfirmOpen(true);
      return;
    }
    setIsModalOpen(false);
  };
  const createModalRef = useModalAccessibility(
    isModalOpen && !isDiscardConfirmOpen,
    requestCreateModalClose,
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const directoryRole = roleFilter ?? "user";
        const query = new URLSearchParams({
          role: directoryRole,
          page: String(page),
          limit: "20",
        });
        const normalizedSearch = searchTerm.trim();
        if (normalizedSearch) {
          query.set("search", normalizedSearch);
        }
        const response = await fetchWithAuth(
          `${apiUrl}/admin/users?${query.toString()}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Unable to load users.");
        }

        const body = (await response.json()) as { users: ManagedUser[]; meta?: PaginationMeta };
        if (!cancelled) {
          setUsers(body.users);
          setTotalUsers(body.meta?.total ?? body.users.length);
          setPagination(body.meta ?? {
            total: body.users.length,
            page,
            limit: 20,
            totalPages: body.users.length > 0 ? 1 : 0,
          });
        }
      } catch (requestError) {
        if (controller.signal.aborted || cancelled) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load users.",
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
  }, [page, reloadKey, roleFilter, searchTerm]);

  useEffect(() => {
    if (!assignmentType) {
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsAssignmentLoading(true);
      setAssignmentError("");

      try {
        const endpoint =
          assignmentType === "nutritionist"
            ? `${apiUrl}/admin/users?role=nutritionist&limit=100&search=${encodeURIComponent(assignmentSearch.trim())}`
            : `${apiUrl}/admin/plans?limit=100&search=${encodeURIComponent(assignmentSearch.trim())}`;
        const response = await fetchWithAuth(endpoint, { signal: controller.signal });

        if (!response.ok) {
          throw new Error("Unable to load assignment options.");
        }

        if (assignmentType === "nutritionist") {
          const body = (await response.json()) as {
            users: Array<NutritionistOption & { role: UserRole }>;
          };

          if (!cancelled) {
            setAssignmentOptions(
              body.users.map(({ id, name, email }) => ({ id, name, email })),
            );
          }
        } else {
          const body = (await response.json()) as { plans: PlanOption[] };

          if (!cancelled) {
            setAssignmentOptions(body.plans);
          }
        }
      } catch (requestError) {
        if (controller.signal.aborted || cancelled) {
          return;
        }

        setAssignmentError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load assignment options.",
        );
      } finally {
        if (!cancelled) {
          setIsAssignmentLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [assignmentSearch, assignmentType]);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth(`${apiUrl}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const body = (await response.json().catch(() => null)) as
        | { user?: ManagedUser; message?: string | string[] }
        | null;

      if (!response.ok || !body?.user) {
        const message = Array.isArray(body?.message)
          ? body.message.join(" ")
          : body?.message;
        throw new Error(message || "Unable to create this user.");
      }

      setReloadKey((currentKey) => currentKey + 1);
      setForm({ email: "", password: "", role: roleFilter ?? "user" });
      setIsModalOpen(false);
      setSuccess(`${body.user.email} can now sign in.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create this user.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAccessToggle(user: ManagedUser) {
    if (user.role !== "user" || accessUpdatingUserId) {
      return;
    }

    const nextDashboardUnlocked = user.dashboardUnlocked === false;
    setError("");
    setSuccess("");
    setAccessUpdatingUserId(user.id);

    try {
      const response = await fetchWithAuth(`${apiUrl}/admin/users/${encodeURIComponent(user.id)}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardUnlocked: nextDashboardUnlocked }),
      });
      const body = (await response.json().catch(() => null)) as
        | { user?: Pick<ManagedUser, "id" | "dashboardUnlocked">; message?: string | string[] }
        | null;

      if (!response.ok || !body?.user) {
        const message = Array.isArray(body?.message)
          ? body.message.join(" ")
          : body?.message;
        throw new Error(message || "Unable to update dashboard access.");
      }

      setUsers((currentUsers) => currentUsers.map((currentUser) => (
        currentUser.id === user.id
          ? { ...currentUser, dashboardUnlocked: body.user?.dashboardUnlocked ?? nextDashboardUnlocked }
          : currentUser
      )));
      setSuccess(
        `${user.name}'s dashboard access is now ${nextDashboardUnlocked ? "approved" : "locked"}.`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update dashboard access.",
      );
    } finally {
      setAccessUpdatingUserId("");
    }
  }

  function openAssignmentModal(user: ManagedUser, type: AssignmentType) {
    setAssignmentType(type);
    setAssignmentUserId(user.id);
    setAssignmentUserName(user.name);
    setAssignmentSearch("");
    setAssignmentOptions([]);
    setIsAssignmentLoading(true);
    setAssignmentError("");
    setAssignmentPlanValidityDays(String(user.plan?.validityDays ?? user.plan?.durationDays ?? 30));
    setAssignmentFormFillingDays(String(user.plan?.formFillingDays ?? user.plan?.durationDays ?? 30));
  }

  function closeAssignmentModal() {
    setAssignmentType(null);
    setAssignmentUserId("");
    setAssignmentUserName("");
    setAssignmentSearch("");
    setAssignmentOptions([]);
    setIsAssignmentLoading(false);
    setAssignmentError("");
    setAssignmentPlanValidityDays("30");
    setAssignmentFormFillingDays("30");
  }

  async function handleAssignment(option: AssignmentOption) {
    if (!assignmentType || !assignmentUserId) {
      return;
    }

    setIsAssignmentSubmitting(true);
    setAssignmentError("");

    try {
      const endpoint = `${apiUrl}/admin/users/${encodeURIComponent(assignmentUserId)}/${assignmentType}`;
      const payload =
        assignmentType === "nutritionist"
          ? { nutritionistId: option.id }
          : {
              planId: option.id,
              planValidityDays: Number(assignmentPlanValidityDays),
              formFillingDays: Number(assignmentFormFillingDays),
            };
      if (
        assignmentType === "plan" &&
        (!Number.isInteger(Number(assignmentPlanValidityDays)) ||
          !Number.isInteger(Number(assignmentFormFillingDays)) ||
          Number(assignmentFormFillingDays) > Number(assignmentPlanValidityDays))
      ) {
        throw new Error("Form filling duration cannot exceed plan validity.");
      }
      const response = await fetchWithAuth(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as
        | { nutritionist?: NutritionistOption; plan?: PlanOption; message?: string | string[] }
        | null;

      if (!response.ok) {
        const message = Array.isArray(body?.message)
          ? body.message.join(" ")
          : body?.message;
        throw new Error(message || "Unable to save this assignment.");
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) => {
          if (user.id !== assignmentUserId) {
            return user;
          }

          return assignmentType === "nutritionist"
            ? { ...user, nutritionist: body?.nutritionist ?? (option as NutritionistOption) }
            : { ...user, plan: body?.plan ?? (option as PlanOption) };
        }),
      );
      setSuccess(
        `${assignmentType === "nutritionist" ? "Nutritionist" : "Plan"} assigned to ${assignmentUserName}.`,
      );
      closeAssignmentModal();
    } catch (requestError) {
      setAssignmentError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this assignment.",
      );
    } finally {
      setIsAssignmentSubmitting(false);
    }
  }

  return (
    <>
        <div className="admin-users-content">
          <p className="dashboard-eyebrow">
            {isNutritionistDirectory ? "MANAGEMENT / NUTRITIONISTS" : "MANAGEMENT / USERS"}
          </p>
          <div className="dashboard-heading-row users-page-heading">
            <div>
                <h1>{isNutritionistDirectory ? "Nutritionists" : "Users"}</h1>
                <p className="dashboard-description">
                  {isNutritionistDirectory
                    ? "Manage nutritionist access and keep the care team connected to the practice."
                    : "Manage account access and create user accounts for the practice."}
              </p>
            </div>
            <button
              className="users-create-button"
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setIsModalOpen(true);
              }}
            >
              Create user <span aria-hidden="true">＋</span>
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
                <p className="dashboard-panel-label">DIRECTORY</p>
                <h2>{isNutritionistDirectory ? "Nutritionist accounts" : "User accounts"}</h2>
              </div>
              <span>{totalUsers} total</span>
            </div>

            <label className="users-search" htmlFor="user-search">
              <span>Search {isNutritionistDirectory ? "nutritionists" : "users"}</span>
              <input
                id="user-search"
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setPage(1);
                  setSearchTerm(event.target.value);
                }}
                aria-label={`Search ${isNutritionistDirectory ? "nutritionists" : "users"} by name or email`}
              />
            </label>

            {isLoading ? (
              <p className="users-empty">Loading users…</p>
            ) : users.length === 0 ? (
              <p className="users-empty">
                {searchTerm.trim()
                  ? `No ${isNutritionistDirectory ? "nutritionists" : "users"} match this search.`
                  : `No ${isNutritionistDirectory ? "nutritionists" : "users"} have been created yet.`}
              </p>
            ) : (
              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      {!isNutritionistDirectory && <th scope="col">Nutritionist</th>}
                      {!isNutritionistDirectory && <th scope="col">Plan</th>}
                      {!isNutritionistDirectory && <th scope="col">Access</th>}
                      <th scope="col">Role</th>
                      <th scope="col">Created</th>
                      {!isNutritionistDirectory && <th scope="col">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((managedUser) => (
                      <tr key={managedUser.id}>
                        <th scope="row">{managedUser.name}</th>
                        <td>{managedUser.email}</td>
                        {!isNutritionistDirectory && (
                          <td>
                            <button
                              className={`users-assignment-control${managedUser.nutritionist ? " is-assigned" : ""}`}
                              type="button"
                              onClick={() => openAssignmentModal(managedUser, "nutritionist")}
                              aria-label={managedUser.nutritionist
                                ? `Change nutritionist for ${managedUser.name}`
                                : `Assign nutritionist to ${managedUser.name}`}
                            >
                              {managedUser.nutritionist?.name ?? <span aria-hidden="true">＋</span>}
                            </button>
                          </td>
                        )}
                        {!isNutritionistDirectory && (
                          <td>
                            <button
                              className={`users-assignment-control${managedUser.plan ? " is-assigned" : ""}`}
                              type="button"
                              onClick={() => openAssignmentModal(managedUser, "plan")}
                              aria-label={managedUser.plan
                                ? `Change plan for ${managedUser.name}`
                                : `Assign plan to ${managedUser.name}`}
                            >
                              {managedUser.plan?.name ?? <span aria-hidden="true">＋</span>}
                            </button>
                          </td>
                        )}
                        {!isNutritionistDirectory && (
                          <td>
                            <span
                              className={`users-access-status${managedUser.dashboardUnlocked === false ? " is-pending" : ""}`}
                              role="status"
                            >
                              {managedUser.dashboardUnlocked === false ? "Pending approval" : "Approved"}
                            </span>
                          </td>
                        )}
                        <td>
                          <span className={`user-role-pill user-role-${managedUser.role}`}>
                            {roleLabels[managedUser.role]}
                          </span>
                        </td>
                        <td>{formatCreatedAt(managedUser.createdAt)}</td>
                        {!isNutritionistDirectory && (
                          <td>
                            <button
                              className={`users-access-control${managedUser.dashboardUnlocked === false ? " is-locked" : ""}`}
                              type="button"
                              disabled={accessUpdatingUserId === managedUser.id}
                              onClick={() => void handleAccessToggle(managedUser)}
                              aria-label={`${managedUser.dashboardUnlocked === false ? "Approve" : "Lock"} dashboard access for ${managedUser.name}`}
                            >
                              {accessUpdatingUserId === managedUser.id
                                ? "Saving…"
                                : managedUser.dashboardUnlocked === false
                                  ? "Approve"
                                  : "Lock"}
                            </button>
                          </td>
                        )}
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
              requestCreateModalClose();
            }
          }}
        >
          <section
            ref={createModalRef}
            className="users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-title"
          >
            <div className="users-modal-heading">
              <div>
                <p className="dashboard-panel-label">CREATE ACCOUNT</p>
                <h2 id="create-user-title">Create an account</h2>
                <p>Assign the access level this account should have.</p>
              </div>
              <button
                className="users-modal-close"
                type="button"
                onClick={requestCreateModalClose}
                aria-label="Close create user dialog"
              >
                ×
              </button>
            </div>

            <form className="users-form" onSubmit={handleCreateUser}>
              <div className="form-field">
                <label htmlFor="new-user-role">Account type</label>
                <RoleDropdown
                  id="new-user-role"
                  value={form.role}
                  lockedRole={roleFilter}
                  onChange={(role) => setForm((currentForm) => ({ ...currentForm, role }))}
                />
              </div>
              <div className="form-field">
                <label htmlFor="new-user-email">Email address</label>
                <input
                  id="new-user-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="new-user-password">Password</label>
                <input
                  id="new-user-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={form.password}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      password: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              {error && (
                <p className="users-feedback users-feedback-error" role="alert">
                  {error}
                </p>
              )}
              <button className="users-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating account…" : "Create account"}
                {!isSubmitting && <span aria-hidden="true">↗</span>}
              </button>
            </form>
          </section>
        </div>
      )}

      {assignmentType && (
        <AssignmentModal
          type={assignmentType}
          userName={assignmentUserName}
          searchTerm={assignmentSearch}
          options={assignmentOptions}
          isLoading={isAssignmentLoading}
          isSubmitting={isAssignmentSubmitting}
          error={assignmentError}
          planValidityDays={assignmentPlanValidityDays}
          formFillingDays={assignmentFormFillingDays}
          onPlanValidityDaysChange={setAssignmentPlanValidityDays}
          onFormFillingDaysChange={setAssignmentFormFillingDays}
          onSearchChange={setAssignmentSearch}
          onSelect={(option) => void handleAssignment(option)}
          onClose={closeAssignmentModal}
        />
      )}
      <ConfirmDialog
        isOpen={isDiscardConfirmOpen}
        title="Leave this account unfinished?"
        description="The account details you entered will be cleared if you leave now."
        confirmLabel="Discard account"
        onCancel={() => setIsDiscardConfirmOpen(false)}
        onConfirm={() => {
          setIsDiscardConfirmOpen(false);
          setIsModalOpen(false);
          setForm({ email: "", password: "", role: roleFilter ?? "user" });
        }}
      />
    </>
  );
}

export default function AdminUsersRoute() {
  return <AdminUsersPage roleFilter="user" />;
}
