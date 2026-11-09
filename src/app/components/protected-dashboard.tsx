"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  apiUrl,
  clearStoredAuth,
  fetchWithAuth,
  type UserRole,
} from "@/app/lib/auth-client";

type DashboardRole = UserRole;

type ProtectedDashboardProps = {
  role: DashboardRole;
};

type DashboardMetrics = {
  activeProgrammes?: number;
  pendingReviews?: number;
  thisMonth?: number;
  currentProgramme?: string;
  nextReviewAt?: string | null;
  daysTended?: number;
  activeForms?: number;
  submittedForms?: number;
  latestNote?: string | null;
  peopleInCare?: number;
  reviewsDue?: number;
  plansActive?: number;
};

type RecentReview = {
  id: string;
  plan: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    archived?: boolean;
  } | null;
  status: "reviewed";
  reviewedAt: string;
};

export function PracticeMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 13.4 10l6.1 2-6.1 2L12 20.5 10.6 14 4.5 12l6.1-2L12 3.5Z" />
      <path d="m18.5 4 .45 2.05L21 6.5l-2.05.45L18.5 9l-.45-2.05L16 6.5l2.05-.45L18.5 4Z" />
    </svg>
  );
}

function MetricMark({ index }: { index: number }) {
  const paths = [
    <path key="people" d="M7.5 10.2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9-1.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8ZM2.8 19.8c.4-3.2 2.2-5 4.7-5s4.3 1.8 4.7 5M13.5 16c.7-.9 1.7-1.4 3-1.4 2.1 0 3.7 1.4 4 3.9" />,
    <path key="review" d="M6 3.8h9.5L19 7.3v12.9H6V3.8Zm9.3.2v3.8H19M9 11h5.5M9 14.5h5.5" />,
    <path key="plans" d="M4.5 7.5 12 3l7.5 4.5L12 12 4.5 7.5Zm0 4.5L12 16.5l7.5-4.5M4.5 16.5 12 21l7.5-4.5" />,
  ];

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[index % paths.length]}
    </svg>
  );
}

export function NotificationMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 10.5a5.5 5.5 0 0 1 11 0c0 5 2 5.5 2 5.5h-15s2-.5 2-5.5ZM10 19h4" />
    </svg>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatReviewDate(value?: string | null) {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function NutritionistRecentReviews({
  reviews,
  status,
  onRetry,
}: {
  reviews: RecentReview[];
  status: "loading" | "ready" | "error";
  onRetry: () => void;
}) {
  return (
    <article className="portal-card portal-review-card dashboard-recent-reviews" aria-labelledby="recent-reviews-title">
      <div className="portal-card-heading">
        <div>
          <p className="dashboard-panel-label">RECENTLY REVIEWED</p>
          <h2 id="recent-reviews-title">Recent user reviews</h2>
        </div>
        <span className="portal-card-badge">{status === "loading" ? "Loading" : `${reviews.length} recent`}</span>
      </div>

      {status === "loading" && (
        <div className="dashboard-reviews-skeleton" aria-label="Loading recent reviews">
          <span />
          <span />
          <span />
        </div>
      )}
      {status === "error" && (
        <div className="dashboard-review-error">
          <p className="portal-muted-copy">Recent reviews are temporarily unavailable.</p>
          <button className="dashboard-inline-retry" type="button" onClick={onRetry}>Try again</button>
        </div>
      )}
      {status === "ready" && reviews.length === 0 && (
        <p className="portal-muted-copy">Reviewed user forms will appear here after you complete a review.</p>
      )}
      {status === "ready" && reviews.length > 0 && (
        <div className="portal-review-list">
          {reviews.map((review) => {
            const userName = review.user?.name ?? "User unavailable";
            return (
              <div className="portal-review-row dashboard-review-row" key={review.id}>
                <span className="portal-review-avatar" aria-hidden="true">{getInitials(userName)}</span>
                <div>
                  <strong>{userName}</strong>
                  <small>{review.plan.name} · Reviewed {formatReviewDate(review.reviewedAt)}</small>
                </div>
                <span className="portal-status-pill portal-status-teal">Reviewed</span>
                <Link
                  href={`/nutritionist/reviews?view=reviewed&instanceId=${encodeURIComponent(review.id)}`}
                  aria-label={`Open ${userName}'s ${review.plan.name} review`}
                >
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <Link className="portal-card-link" href="/nutritionist/reviews?view=reviewed">
        Open review history <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}

const dashboardCopy = {
  admin: {
    eyebrow: "ADMINISTRATION / व्यवस्थापन",
    title: "Practice overview",
    description:
      "Monitor your practice workspace and manage the people who have access.",
    overview: "System status: active",
    metricLabels: ["Active programmes", "Pending reviews", "This month"],
    note: "Keep the practice clear, current and considered.",
    panelTitle: "Operations",
    panelText:
      "Keep account access current and move into the areas of the practice you manage.",
  },
  user: {
    eyebrow: "YOUR INNER ROOM / आपका स्थान",
    title: "A steadier way forward.",
    description:
      "Return to your plan, review the changes you are making, and keep the conversation with your body going.",
    overview: "User access verified",
    metricLabels: ["Current programme", "Next review", "Days tended"],
    note: "Keep tending your own next step, one considered day at a time.",
    panelTitle: "Your next step",
    panelText:
      "Your personal space will bring together your programme, notes and measured progress in one quiet place.",
  },
  nutritionist: {
    eyebrow: "NUTRITION CARE / पोषण",
    title: "Guide each person with clarity.",
    description:
      "Review the people entrusted to your care, keep their programmes considered, and turn observations into the next useful step.",
    overview: "Nutritionist access verified",
    metricLabels: ["People in care", "Reviews due", "Plans active"],
    note: "Bring the whole person into every next step.",
    panelTitle: "Care workspace",
    panelText:
      "Your nutritionist space will bring together user programmes, notes and measured progress so each plan can respond to the person in front of you.",
  },
} as const;

export function DashboardContent({ role }: ProtectedDashboardProps) {
  const copy = dashboardCopy[role];
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics>({});
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [recentReviewsStatus, setRecentReviewsStatus] = useState<"loading" | "ready" | "error">(
    role === "nutritionist" ? "loading" : "ready",
  );
  const [error, setError] = useState("");
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    function handleUnauthorized(response: Response) {
      if (response.status !== 401 && response.status !== 403) return false;
      clearStoredAuth();
      router.replace(role === "admin" ? "/admin" : "/login");
      return true;
    }

    async function loadOverview() {
      try {
        const response = await fetchWithAuth(`${apiUrl}/${role}/overview`, { signal: controller.signal });
        const body = (await response.json().catch(() => null)) as
          | { metrics?: DashboardMetrics; message?: string | string[] }
          | null;

        if (!response.ok || !body?.metrics) {
          if (handleUnauthorized(response)) return;
          throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message || "Unable to load workspace metrics.");
        }

        if (!cancelled) {
          setMetrics(body.metrics);
          setStatus("ready");
        }
      } catch (requestError) {
        if (!cancelled && !(requestError instanceof Error && requestError.name === "AbortError")) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load workspace metrics.");
          setStatus("error");
        }
      }
    }

    async function loadRecentReviews() {
      if (role !== "nutritionist") return;
      try {
        const response = await fetchWithAuth(`${apiUrl}/nutritionist/reviews/recent?limit=5`, { signal: controller.signal });
        const body = (await response.json().catch(() => null)) as
          | { reviews?: RecentReview[]; message?: string | string[] }
          | null;
        if (!response.ok || !body?.reviews) {
          if (handleUnauthorized(response)) return;
          throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message || "Unable to load recent reviews.");
        }
        if (!cancelled) {
          setRecentReviews(body.reviews);
          setRecentReviewsStatus("ready");
        }
      } catch (requestError) {
        if (!cancelled && !(requestError instanceof Error && requestError.name === "AbortError")) {
          setRecentReviewsStatus("error");
        }
      }
    }

    void loadOverview();
    void loadRecentReviews();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [retryNonce, role, router]);

  function retryDashboard() {
    setError("");
    setStatus("loading");
    if (role === "nutritionist") {
      setRecentReviewsStatus("loading");
    }
    setRetryNonce((current) => current + 1);
  }

  const metricValues = role === "admin"
    ? [metrics.activeProgrammes, metrics.pendingReviews, metrics.thisMonth]
    : role === "nutritionist"
      ? [metrics.peopleInCare, metrics.reviewsDue, metrics.plansActive]
      : [metrics.currentProgramme, metrics.nextReviewAt ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(metrics.nextReviewAt)) : "—", metrics.daysTended];

  return (
    <section className="dashboard-content" id="dashboard-content">
      <p className="dashboard-eyebrow">{copy.eyebrow}</p>
      <div className="dashboard-heading-row">
        <div>
          <h1>{copy.title}</h1>
          <p className="dashboard-description">{copy.description}</p>
        </div>
        <span className="dashboard-verified">{copy.overview}</span>
      </div>

      {status === "error" && (
        <div className="users-feedback users-feedback-error dashboard-error-feedback" role="alert">
          <span>{error}</span>
          <button className="dashboard-inline-retry" type="button" onClick={retryDashboard}>Try again</button>
        </div>
      )}

      <div className="dashboard-metrics">
        {copy.metricLabels.map((label, index) => (
          <article className="dashboard-metric" key={label}>
            <div className="dashboard-metric-main">
              <span>{label}</span>
              <strong>{status === "loading" ? "…" : metricValues[index] ?? "—"}</strong>
              <small>
                {role === "admin"
                  ? "Across the practice"
                  : role === "nutritionist"
                    ? "Current workspace"
                    : "This month"}
              </small>
            </div>
            <span className={`dashboard-metric-icon dashboard-metric-icon-${index}`}>
              <MetricMark index={index} />
            </span>
          </article>
        ))}
      </div>

      <article className="dashboard-feature-panel">
        <div>
          <p className="dashboard-panel-label">
            {role === "admin"
              ? "01 / OPERATE"
              : role === "nutritionist"
                ? "01 / GUIDE"
                : "01 / TEND"}
          </p>
          <h2>{copy.panelTitle}</h2>
        </div>
        <p>{copy.panelText}</p>
        {role === "admin" && (
          <div className="dashboard-action-row">
            <Link className="dashboard-action" href="/admin/users">
              Manage accounts <span aria-hidden="true">↗</span>
            </Link>
            <Link className="dashboard-action dashboard-action-secondary" href="/admin/instances">
              View assigned forms <span aria-hidden="true">↗</span>
            </Link>
          </div>
        )}
        {role === "user" && (
          <div className="dashboard-action-row">
            <Link className="dashboard-action" href="/user/plan">
              Open my plan <span aria-hidden="true">↗</span>
            </Link>
            <Link className="dashboard-action dashboard-action-secondary" href="/user/progress">
              Log a check-in <span aria-hidden="true">↗</span>
            </Link>
          </div>
        )}
        {role === "nutritionist" && (
          <div className="dashboard-action-row">
            <Link className="dashboard-action" href="/nutritionist/people">
              View people in care <span aria-hidden="true">↗</span>
            </Link>
            <Link className="dashboard-action dashboard-action-secondary" href="/nutritionist/reviews">
              Review due items <span aria-hidden="true">↗</span>
            </Link>
          </div>
        )}
      </article>

      {role === "nutritionist" && (
        <NutritionistRecentReviews
          reviews={recentReviews}
          status={recentReviewsStatus}
          onRetry={retryDashboard}
        />
      )}
    </section>
  );
}
