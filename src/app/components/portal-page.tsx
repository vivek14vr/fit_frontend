"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  apiUrl,
  clearStoredAuth,
  ensureAccessToken,
  fetchWithAuth,
  type UserRole,
} from "@/app/lib/auth-client";
import { NotificationMark, PracticeMark } from "@/app/components/protected-dashboard";
import { PaginationControls } from "@/app/components/pagination-controls";

type PortalUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dashboardUnlocked: boolean;
};

type PortalPageProps = {
  role: UserRole;
  children: ReactNode;
};

type PortalNavItem = {
  label: string;
  href: string;
  group?: string;
};

const PortalUserContext = createContext<PortalUser | null>(null);

export function usePortalUser() {
  return useContext(PortalUserContext);
}

const portalNavigation: Record<UserRole, PortalNavItem[]> = {
  user: [
    { label: "My overview", href: "/user/dashboard" },
    { label: "My plan", href: "/user/plan", group: "CARE PLAN" },
    { label: "Progress", href: "/user/progress" },
    { label: "Diet tracking", href: "/user/diet-tracking", group: "DIET TRACKING" },
    { label: "My profile", href: "/user/profile", group: "ACCOUNT" },
  ],
  nutritionist: [
    { label: "Care overview", href: "/nutritionist/dashboard" },
    { label: "People in care", href: "/nutritionist/people", group: "CARE OPERATIONS" },
    { label: "Care programmes", href: "/nutritionist/programmes" },
    { label: "Reviews due", href: "/nutritionist/reviews" },
  ],
  admin: [
    { label: "Overview", href: "/admin/dashboard" },
    { label: "Users", href: "/admin/users", group: "MANAGEMENT" },
  ],
};

const portalCopy: Record<
  UserRole,
  { label: string; context: string; note: string }
> = {
  user: {
    label: "YOUR SPACE",
    context: "Your personal programme",
    note: "Keep tending the fire, one considered step at a time.",
  },
  nutritionist: {
    label: "NUTRITION WORKSPACE",
    context: "User programme care",
    note: "Bring the whole person into every next step.",
  },
  admin: {
    label: "ADMIN WORKSPACE",
    context: "Practice operations",
    note: "Keep the practice clear, current and considered.",
  },
};

function dashboardPathForRole(role: UserRole) {
  return role === "admin"
    ? "/admin/dashboard"
    : role === "nutritionist"
      ? "/nutritionist/dashboard"
      : "/user/dashboard";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getPortalError(body: { message?: string | string[] } | null, fallback: string) {
  return Array.isArray(body?.message) ? body.message.join(" ") : body?.message || fallback;
}

function LockedUserWorkspace({
  user,
  onLogout,
  onRefresh,
  isRefreshing,
}: {
  user: PortalUser;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <main className="dashboard-page dashboard-user portal-locked-page">
      <header className="dashboard-topbar">
        <div className="dashboard-shell dashboard-topbar-inner">
          <Link className="dashboard-wordmark" href="/">
            <span className="dashboard-brand-lockup">
              <span className="dashboard-brand-mark"><PracticeMark /></span>
              <span className="dashboard-brand-name">DEEPTI SHERAWAT</span>
            </span>
            <small>AYURVEDIC &amp; FUNCTIONAL NUTRITION</small>
          </Link>
          <div className="dashboard-account">
            <span className="dashboard-avatar" aria-hidden="true">{getInitials(user.name)}</span>
            <span className="dashboard-account-copy">
              <span className="dashboard-account-name">{user.name}</span>
              <span className="dashboard-role-badge">User</span>
            </span>
            <button className="dashboard-logout" type="button" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <section className="portal-locked-content" aria-labelledby="portal-locked-title">
        <div className="portal-locked-card">
          <p className="dashboard-eyebrow">ACCOUNT ACTIVATION / प्रवेश</p>
          <h1 id="portal-locked-title">Your care space is waiting.</h1>
          <p>
            Your account is ready, but an admin needs to unlock your dashboard before you can access your plans and progress.
          </p>
          <div className="portal-locked-status" role="status">
            <span className="portal-locked-status-mark" aria-hidden="true">•</span>
            <span>
              <strong>Awaiting admin approval</strong>
              <small>We will make your workspace available once access is approved.</small>
            </span>
          </div>
          <div className="portal-locked-actions">
            <button
              className="portal-locked-refresh"
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Checking approval…" : "Check approval status"}
            </button>
            <button className="portal-locked-signout" type="button" onClick={onLogout}>
              Sign out
            </button>
          </div>
          <p className="portal-locked-polling">
            We’ll check automatically every 15 seconds while your account is waiting.
          </p>
        </div>
      </section>
    </main>
  );
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

type UserOverviewMetrics = {
  currentProgramme: string;
  nextReviewAt?: string | null;
  daysTended: number;
  activeForms: number;
  submittedForms: number;
  latestNote?: string | null;
};

type NutritionistPerson = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type NutritionistProgramme = {
  id: string;
  name: string;
  people: number;
  latestDueAt?: string | null;
};

export function ProtectedPortalLayout({ role, children }: PortalPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<PortalUser | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "locked" | "session-expired" | "unavailable"
  >("loading");
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshInFlightRef = useRef(false);
  const portalRequestRef = useRef<AbortController | null>(null);
  const copy = portalCopy[role];

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const previousController = portalRequestRef.current;
    previousController?.abort();
    portalRequestRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

    async function loadPortal() {
      refreshInFlightRef.current = true;

      try {
        const token = await ensureAccessToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        const authResponse = await fetchWithAuth(`${apiUrl}/auth/me`, { signal: controller.signal });
        const authBody = (await authResponse.json().catch(() => null)) as
          | { user?: PortalUser }
          | null;

        if (!authResponse.ok || !authBody?.user) {
          if (authResponse.status === 401 || authResponse.status === 403) {
            clearStoredAuth();
            if (!cancelled) setStatus("session-expired");
            return;
          }

          throw new Error("The practice service is unavailable.");
        }

        if (authBody.user.role !== role) {
          router.replace(dashboardPathForRole(authBody.user.role));
          return;
        }

        if (!cancelled) {
          setUser(authBody.user);
          setStatus(role === "user" && authBody.user.dashboardUnlocked === false ? "locked" : "ready");
        }
      } catch (error) {
        if (!cancelled && !isAbortError(error)) setStatus("unavailable");
      } finally {
        window.clearTimeout(timeoutId);
        if (portalRequestRef.current === controller) {
          portalRequestRef.current = null;
          refreshInFlightRef.current = false;
          if (!cancelled) setIsRefreshing(false);
        }
      }
    }

    void loadPortal();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (portalRequestRef.current === controller) {
        portalRequestRef.current = null;
        refreshInFlightRef.current = false;
      }
      controller.abort();
    };
  }, [retryCount, role, router]);

  useEffect(() => {
    if (role !== "user" || status !== "locked") {
      return;
    }

    const interval = window.setInterval(() => {
      if (refreshInFlightRef.current) {
        return;
      }

      setIsRefreshing(true);
      setRetryCount((count) => count + 1);
    }, 15_000);

    return () => window.clearInterval(interval);
  }, [role, status]);

  function handleLogout() {
    clearStoredAuth();
    router.replace("/login");

    void fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      console.warn("Logout request did not complete after the local session was cleared.");
    });
  }

  if (status === "loading") {
    return (
      <main className="dashboard-page dashboard-loading">
        <div className="dashboard-loading-card">
          <p>Checking your access…</p>
          <div className="dashboard-loading-actions">
            <button
              className="dashboard-retry-button"
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Try again
            </button>
            <button className="dashboard-loading-signout" type="button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (status === "session-expired") {
    return (
      <main className="dashboard-page dashboard-loading">
        <div className="dashboard-loading-card">
          <p>Your session has expired. Please sign in again.</p>
          <Link className="dashboard-home-link" href="/login">
            Return to sign in
          </Link>
        </div>
      </main>
    );
  }

  if (status === "unavailable") {
    return (
      <main className="dashboard-page dashboard-loading">
        <div className="dashboard-loading-card">
          <p>We could not reach the practice service.</p>
          <p className="dashboard-loading-help">
            Check that the backend is running, then try again.
          </p>
          <button
            className="dashboard-retry-button"
            type="button"
            onClick={() => {
              setStatus("loading");
              setRetryCount((count) => count + 1);
            }}
          >
            Try again
          </button>
          <Link className="dashboard-home-link" href="/login">
            Return to sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!user) return null;

  if (status === "locked") {
    return (
      <LockedUserWorkspace
        user={user}
        onLogout={() => void handleLogout()}
        onRefresh={() => {
          if (refreshInFlightRef.current) {
            return;
          }

          setIsRefreshing(true);
          setRetryCount((count) => count + 1);
        }}
        isRefreshing={isRefreshing}
      />
    );
  }

  const navItems = portalNavigation[role];

  return (
    <main className={`dashboard-page dashboard-${role} portal-page`}>
      <header className="dashboard-topbar">
        <div className="dashboard-shell dashboard-topbar-inner">
          <Link className="dashboard-wordmark" href="/">
            <span className="dashboard-brand-lockup">
              <span className="dashboard-brand-mark"><PracticeMark /></span>
              <span className="dashboard-brand-name">DEEPTI SHERAWAT</span>
            </span>
            <small>AYURVEDIC &amp; FUNCTIONAL NUTRITION</small>
          </Link>
          <div className="dashboard-account">
            <button className="dashboard-notification" type="button" aria-label="Notifications">
              <NotificationMark />
              <span aria-hidden="true" />
            </button>
            <span className="dashboard-avatar" aria-hidden="true">{getInitials(user.name)}</span>
            <span className="dashboard-account-copy">
              <span className="dashboard-account-name">{user.name}</span>
              <span className="dashboard-role-badge">{role}</span>
            </span>
            <button className="dashboard-logout" type="button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-shell dashboard-layout">
        <aside className="dashboard-sidebar" aria-label={`${role} navigation`}>
          <p className="dashboard-sidebar-label">{copy.label}</p>
          <p className="dashboard-sidebar-context">{copy.context}</p>
          <nav className="dashboard-nav">
            {navItems.map((item) => (
              <span key={item.href}>
                {item.group && <span className="dashboard-nav-group-label">{item.group}</span>}
                {item.href === pathname ? (
                  <span className="dashboard-nav-static dashboard-nav-active" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href}>{item.label}</Link>
                )}
              </span>
            ))}
          </nav>
          <div className="dashboard-sidebar-note">
            <span>अग्नि</span>
            <p>{copy.note}</p>
          </div>
        </aside>

        <section className="dashboard-content portal-page-content">
          <PortalUserContext.Provider value={user}>
            {children}
          </PortalUserContext.Provider>
        </section>
      </div>
    </main>
  );
}

export function ProtectedPortalPage({ role, children }: PortalPageProps) {
  return <ProtectedPortalLayout role={role}>{children}</ProtectedPortalLayout>;
}

const userPlanRows = [
  ["Morning", "Warm water + breakfast before 9:00", "Daily"],
  ["Midday", "Balanced plate with a clear protein source", "Most days"],
  ["Evening", "A lighter meal and ten quiet minutes", "Daily"],
];

export function UserPlanContent() {
  return (
    <>
      <div className="portal-heading-row">
        <div>
          <p className="dashboard-eyebrow">YOUR PLAN / योजना</p>
          <h1>Make the next step practical.</h1>
          <p className="dashboard-description">
            Your current plan is designed to build steadier energy without asking you to change everything at once.
          </p>
        </div>
        <span className="dashboard-verified">Plan active</span>
      </div>

      <div className="portal-summary-grid">
        <article className="portal-summary-card"><span>Programme</span><strong>Metabolic balance</strong><small>Started 18 Sep 2026</small></article>
        <article className="portal-summary-card"><span>Next review</span><strong>14 Oct</strong><small>Bring your observations</small></article>
        <article className="portal-summary-card"><span>Days tended</span><strong>27</strong><small>Keep the rhythm gentle</small></article>
      </div>

      <article className="portal-feature-card portal-feature-card-teal">
        <div>
          <p className="dashboard-panel-label">01 / CURRENT FOCUS</p>
          <h2>Build a steadier morning.</h2>
        </div>
        <p>Start with the first meal, the first glass of water and the first signal your body gives you. Small details make the rest of the day easier to read.</p>
      </article>

      <div className="portal-two-column">
        <article className="portal-card">
          <div className="portal-card-heading"><div><p className="dashboard-panel-label">THIS WEEK</p><h2>Your rhythm</h2></div><span className="portal-card-badge">In progress</span></div>
          <div className="portal-week-grid">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span className={index < 5 ? "is-complete" : ""} key={`${day}-${index}`}>{day}<b>{index < 5 ? "✓" : "·"}</b></span>)}
          </div>
          <p className="portal-muted-copy">Five considered days. Leave room for the weekend to be real.</p>
        </article>
        <article className="portal-card">
          <div className="portal-card-heading"><div><p className="dashboard-panel-label">NEXT CONVERSATION</p><h2>Review notes</h2></div><span className="portal-arrow" aria-hidden="true">↗</span></div>
          <p className="portal-muted-copy">Write down what felt easy, what felt difficult and one question you want to bring to your next review.</p>
          <Link className="portal-card-link" href="/user/progress">See your progress <span aria-hidden="true">↗</span></Link>
        </article>
      </div>

      <article className="portal-card portal-table-card">
        <div className="portal-card-heading"><div><p className="dashboard-panel-label">DAILY GUIDE</p><h2>Three anchors for this phase</h2></div></div>
        <div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Time</th><th>Practice</th><th>Cadence</th></tr></thead><tbody>{userPlanRows.map((row) => <tr key={row[0]}><th scope="row">{row[0]}</th><td>{row[1]}</td><td><span className="portal-status-pill">{row[2]}</span></td></tr>)}</tbody></table></div>
      </article>
    </>
  );
}

export function UserProgressContent() {
  const [metrics, setMetrics] = useState<UserOverviewMetrics | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadProgress() {
      try {
        const response = await fetchWithAuth(`${apiUrl}/user/overview`, { signal: controller.signal });
        const body = (await response.json().catch(() => null)) as
          | { metrics?: UserOverviewMetrics; message?: string | string[] }
          | null;
        if (!response.ok || !body?.metrics) {
          throw new Error(getPortalError(body, "Unable to load your progress."));
        }
        if (!cancelled) {
          setMetrics(body.metrics);
          setStatus("ready");
        }
      } catch (requestError) {
        if (!cancelled && !isAbortError(requestError)) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load your progress.");
          setStatus("error");
        }
      }
    }

    void loadProgress();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const nextReview = metrics?.nextReviewAt
    ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(metrics.nextReviewAt))
    : "—";

  return (
    <>
      <div className="portal-heading-row">
        <div>
          <p className="dashboard-eyebrow">MEASURED PROGRESS / प्रगति</p>
          <h1>Notice what is changing.</h1>
          <p className="dashboard-description">Progress is more than a number. Use these signals to see where your daily practice is beginning to create room.</p>
        </div>
        <span className="dashboard-verified">{status === "loading" ? "Loading…" : "Live workspace data"}</span>
      </div>

      {status === "error" && <p className="users-feedback users-feedback-error" role="alert">{error}</p>}

      <div className="portal-summary-grid">
        <article className="portal-summary-card"><span>Days tended</span><strong>{metrics?.daysTended ?? "—"}</strong><small>Recorded from your forms</small></article>
        <article className="portal-summary-card"><span>Active forms</span><strong>{metrics?.activeForms ?? "—"}</strong><small>Currently assigned to you</small></article>
        <article className="portal-summary-card"><span>Next review</span><strong>{nextReview}</strong><small>{metrics?.submittedForms ?? 0} submitted forms</small></article>
      </div>

      <div className="portal-two-column portal-progress-layout">
        <article className="portal-card portal-chart-card">
          <div className="portal-card-heading"><div><p className="dashboard-panel-label">CURRENT PROGRAMME</p><h2>{metrics?.currentProgramme ?? "Loading programme…"}</h2></div><span className="portal-card-badge">Backend data</span></div>
          <p className="portal-muted-copy">Your progress is calculated from the form entries recorded in your care workspace. Continue completing assigned forms to make the pattern more useful.</p>
          <Link className="portal-card-link" href="/user/diet-tracking">Open diet tracking <span aria-hidden="true">↗</span></Link>
        </article>
        <article className="portal-card">
          <div className="portal-card-heading"><div><p className="dashboard-panel-label">NUTRITIONIST NOTE</p><h2>{metrics?.latestNote ? "Latest guidance" : "No note yet"}</h2></div></div>
          <p className="portal-muted-copy">{metrics?.latestNote ?? "Your nutritionist notes will appear here after a submitted form has been reviewed."}</p>
        </article>
      </div>

      <article className="portal-feature-card portal-feature-card-paper">
        <div><p className="dashboard-panel-label">NEXT USEFUL STEP</p><h2>Keep the record honest.</h2></div>
        <p>Complete each assigned occurrence for the day you are recording. Your nutritionist will use those entries to guide the next considered step.</p>
      </article>
    </>
  );
}

export function UserProfileContent() {
  const user = usePortalUser();

  return (
    <>
      <div className="portal-heading-row">
        <div>
          <p className="dashboard-eyebrow">MY PROFILE / परिचय</p>
          <h1>Your care, in context.</h1>
          <p className="dashboard-description">Keep the details that help your nutritionist understand the person behind the programme.</p>
        </div>
        <span className="dashboard-verified">Private by design</span>
      </div>
      <div className="portal-two-column">
        <article className="portal-card"><div className="portal-card-heading"><div><p className="dashboard-panel-label">ACCOUNT</p><h2>Personal details</h2></div></div><dl className="portal-detail-list"><div><dt>Name</dt><dd>{user?.name ?? "Your name"}</dd></div><div><dt>Email</dt><dd>{user?.email ?? "Your email"}</dd></div><div><dt>Access</dt><dd>Personal programme</dd></div></dl></article>
        <article className="portal-card"><div className="portal-card-heading"><div><p className="dashboard-panel-label">PRACTICE NOTE</p><h2>What matters here</h2></div></div><p className="portal-muted-copy">Your profile is a calm place to keep the context that should travel with your plan. More detail can be added as your care relationship grows.</p><span className="portal-card-badge">Profile complete</span></article>
      </div>
    </>
  );
}

export function NutritionistPeopleContent() {
  const [people, setPeople] = useState<NutritionistPerson[]>([]);
  const [metrics, setMetrics] = useState<{ peopleInCare: number; reviewsDue: number; plansActive: number } | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [metricsError, setMetricsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadMetrics() {
      try {
        const overviewResponse = await fetchWithAuth(`${apiUrl}/nutritionist/overview`, { signal: controller.signal });
        const overviewBody = (await overviewResponse.json().catch(() => null)) as
          | { metrics?: { peopleInCare: number; reviewsDue: number; plansActive: number }; message?: string | string[] }
          | null;
        if (!overviewResponse.ok || !overviewBody?.metrics) throw new Error(getPortalError(overviewBody, "Unable to load care metrics."));
        if (!cancelled) {
          setMetrics(overviewBody.metrics);
          setMetricsError("");
        }
      } catch (requestError) {
        if (!cancelled && !isAbortError(requestError)) {
          setMetricsError(requestError instanceof Error ? requestError.message : "Unable to load care metrics.");
        }
      }
    }
    void loadMetrics();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadPeople() {
      setStatus("loading");
      try {
        const response = await fetchWithAuth(
          `${apiUrl}/nutritionist/people?page=${page}&limit=20`,
          { signal: controller.signal },
        );
        const body = (await response.json().catch(() => null)) as
          | { people?: NutritionistPerson[]; meta?: PaginationMeta; message?: string | string[] }
          | null;
        if (!response.ok || !body?.people) {
          throw new Error(getPortalError(body, "Unable to load people in care."));
        }
        if (!cancelled) {
          setPeople(body.people);
          setError("");
          setPagination(body.meta ?? {
            total: body.people.length,
            page,
            limit: 20,
            totalPages: body.people.length > 0 ? 1 : 0,
          });
          setStatus("ready");
        }
      } catch (requestError) {
        if (!cancelled && !isAbortError(requestError)) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load people in care.");
          setStatus("error");
        }
      }
    }

    void loadPeople();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page]);

  return (
    <>
      <div className="portal-heading-row"><div><p className="dashboard-eyebrow">PEOPLE IN CARE / व्यक्ति</p><h1>Keep every person in view.</h1><p className="dashboard-description">A clear working list for the people entrusted to your care, with the next useful action close at hand.</p></div><span className="dashboard-verified">{status === "loading" ? "Loading…" : `${metrics?.peopleInCare ?? 0} active people`}</span></div>
      {(error || metricsError) && <p className="users-feedback users-feedback-error" role="alert">{error || metricsError}</p>}
      <div className="portal-summary-grid"><article className="portal-summary-card"><span>Active people</span><strong>{metrics?.peopleInCare ?? "—"}</strong><small>Backend directory count</small></article><article className="portal-summary-card"><span>Reviews due</span><strong>{metrics?.reviewsDue ?? "—"}</strong><small>Submitted forms awaiting review</small></article><article className="portal-summary-card"><span>Forms active</span><strong>{metrics?.plansActive ?? "—"}</strong><small>Currently being tended</small></article></div>
      <article className="portal-card portal-table-card"><div className="portal-card-heading"><div><p className="dashboard-panel-label">CARE DIRECTORY</p><h2>People in your workspace</h2></div><span className="portal-card-badge">{pagination.total} total</span></div><div className="portal-table-wrap"><table className="portal-table portal-people-table"><thead><tr><th scope="col">Person</th><th scope="col">Email</th><th scope="col">Account created</th></tr></thead><tbody>{people.map((person) => <tr key={person.id}><th scope="row">{person.name}</th><td>{person.email}</td><td>{person.createdAt ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(person.createdAt)) : "—"}</td></tr>)}</tbody></table></div>{status === "ready" && people.length === 0 && <p className="users-empty">No people are currently assigned to your care.</p>}<PaginationControls page={pagination.page} totalPages={pagination.totalPages} isLoading={status === "loading"} onPageChange={setPage} /></article>
      <article className="portal-feature-card portal-feature-card-teal"><div><p className="dashboard-panel-label">CARE WORKSPACE</p><h2>Turn observations into the next useful step.</h2></div><p>Keep programmes, notes and measured progress together so every review begins with the person—not a blank page.</p></article>
    </>
  );
}

export function NutritionistProgrammesContent() {
  const [programmes, setProgrammes] = useState<NutritionistProgramme[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadProgrammes() {
      try {
        const response = await fetchWithAuth(`${apiUrl}/nutritionist/programmes`, { signal: controller.signal });
        const body = (await response.json().catch(() => null)) as
          | { programmes?: NutritionistProgramme[]; message?: string | string[] }
          | null;
        if (!response.ok || !body?.programmes) throw new Error(getPortalError(body, "Unable to load programmes."));
        if (!cancelled) {
          setProgrammes(body.programmes);
          setStatus("ready");
        }
      } catch (requestError) {
        if (!cancelled && !isAbortError(requestError)) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load programmes.");
          setStatus("error");
        }
      }
    }
    void loadProgrammes();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <>
      <div className="portal-heading-row"><div><p className="dashboard-eyebrow">PROGRAMMES / कार्यक्रम</p><h1>Plans with room to respond.</h1><p className="dashboard-description">See the active care frameworks in your practice and the people currently moving through each one.</p></div><span className="dashboard-verified">{status === "loading" ? "Loading…" : `${programmes.length} active programmes`}</span></div>
      {status === "error" && <p className="users-feedback users-feedback-error" role="alert">{error}</p>}
      <div className="portal-programme-grid">{programmes.map((programme, index) => <article className={`portal-programme-card portal-programme-${index % 3}`} key={programme.id}><div className="portal-programme-topline"><span>{String(index + 1).padStart(2, "0")}</span><span aria-hidden="true">↗</span></div><p className="dashboard-panel-label">ACTIVE PROGRAMME</p><h2>{programme.name}</h2><p>Assigned care forms currently active in your workspace.</p><span className="portal-programme-count">{programme.people} {programme.people === 1 ? "person" : "people"}</span></article>)}</div>
      {status === "ready" && programmes.length === 0 && <article className="portal-card portal-empty-card"><p className="dashboard-panel-label">NO ACTIVE PROGRAMMES</p><h2>Programmes will appear here when plans are assigned.</h2></article>}
      <article className="portal-card portal-wide-card"><div className="portal-card-heading"><div><p className="dashboard-panel-label">PROGRAMME PRINCIPLE</p><h2>Clarity before complexity.</h2></div></div><p className="portal-muted-copy">The best programme is the one that can be understood, lived and adjusted by the person it belongs to.</p></article>
    </>
  );
}

