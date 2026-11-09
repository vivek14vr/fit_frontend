"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  apiUrl,
  clearStoredAuth,
  ensureAccessToken,
  fetchWithAuth,
  type UserRole,
} from "@/app/lib/auth-client";
import { NotificationMark, PracticeMark } from "@/app/components/protected-dashboard";

type AdminUser = {
  name: string;
  role: UserRole;
};

type AdminLayoutProps = {
  children: ReactNode;
};

type AdminStatus = "loading" | "ready" | "session-expired" | "unavailable";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function dashboardPathForRole(role: UserRole) {
  return role === "nutritionist" ? "/nutritionist/dashboard" : "/user/dashboard";
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginRoute = pathname === "/admin";
  const [user, setUser] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<AdminStatus>("loading");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (isLoginRoute) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

    async function loadAdminSession() {
      try {
        const token = await ensureAccessToken();

        if (!token) {
          router.replace("/admin");
          return;
        }

        const authResponse = await fetchWithAuth(`${apiUrl}/auth/me`, { signal: controller.signal });
        const authBody = (await authResponse.json().catch(() => null)) as
          | { user?: AdminUser }
          | null;

        if (cancelled) {
          return;
        }

        if (!authResponse.ok) {
          if (authResponse.status === 401 || authResponse.status === 403) {
            clearStoredAuth();
            setStatus("session-expired");
            return;
          }

          throw new Error("The practice service is unavailable.");
        }

        if (authBody?.user?.role !== "admin") {
          router.replace(
            authBody?.user?.role
              ? dashboardPathForRole(authBody.user.role)
              : "/admin",
          );
          return;
        }

        if (!cancelled && authBody.user) {
          setUser(authBody.user);
          setStatus("ready");
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          if (!cancelled) {
            setStatus("unavailable");
          }
          return;
        }
        console.warn("Admin session check failed.", error instanceof Error ? error.name : "UnknownError");
        if (!cancelled) {
          setStatus("unavailable");
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    void loadAdminSession();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [isLoginRoute, retryCount, router]);

  function handleLogout() {
    clearStoredAuth();
    setUser(null);
    router.replace("/admin");

    void fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      console.warn("Logout request did not complete after the local session was cleared.");
    });
  }

  if (isLoginRoute) {
    return children;
  }

  if (status === "loading") {
    return (
      <main className="dashboard-page dashboard-loading">
        <div className="dashboard-loading-card">
          <p>Checking your admin access…</p>
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
          <p>Your admin session has expired. Please sign in again.</p>
          <Link className="dashboard-home-link" href="/admin">
            Return to admin sign in
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
          <Link className="dashboard-home-link" href="/admin">
            Return to admin sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const isOverview = pathname === "/admin/dashboard";
  const isUsers = pathname === "/admin/users";
  const isNutritionists = pathname === "/admin/nutritionists";
  const isPlans = pathname === "/admin/plans";
  const isInstances = pathname === "/admin/instances";

  return (
    <main className="dashboard-page dashboard-admin">
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
            <span className="dashboard-avatar" aria-hidden="true">
              {getInitials(user.name)}
            </span>
            <span className="dashboard-account-copy">
              <span className="dashboard-account-name">{user.name}</span>
              <span className="dashboard-role-badge">Admin</span>
            </span>
            <button className="dashboard-logout" type="button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-shell dashboard-layout">
        <aside className="dashboard-sidebar" aria-label="Admin navigation">
          <p className="dashboard-sidebar-label">ADMIN WORKSPACE</p>
          <p className="dashboard-sidebar-context">Practice operations</p>
          <nav className="dashboard-nav">
            <Link
              className={isOverview ? "dashboard-nav-active" : undefined}
              href="/admin/dashboard"
              aria-current={isOverview ? "page" : undefined}
            >
              Overview
            </Link>
            <span className="dashboard-nav-group-label">USER ACCOUNTS</span>
            <Link
              className={`dashboard-nav-users${isUsers ? " dashboard-nav-active" : ""}`}
              href="/admin/users"
              aria-current={isUsers ? "page" : undefined}
            >
              Users
            </Link>
            <span className="dashboard-nav-group-label">NUTRITIONIST TEAM</span>
            <Link
              className={`dashboard-nav-nutritionists${isNutritionists ? " dashboard-nav-active" : ""}`}
              href="/admin/nutritionists"
              aria-current={isNutritionists ? "page" : undefined}
            >
              Nutritionists
            </Link>
            <span className="dashboard-nav-group-label">CARE PROGRAMMES</span>
            <Link
              className={`dashboard-nav-plans${isPlans ? " dashboard-nav-active" : ""}`}
              href="/admin/plans"
              aria-current={isPlans ? "page" : undefined}
            >
              Plans
            </Link>
            <Link
              className={`dashboard-nav-instances${isInstances ? " dashboard-nav-active" : ""}`}
              href="/admin/instances"
              aria-current={isInstances ? "page" : undefined}
            >
              Assigned forms
            </Link>
          </nav>
          <div className="dashboard-sidebar-note">
            <span>अग्नि</span>
            <p>Keep tending the practice, one considered step at a time.</p>
          </div>
        </aside>

        <section className="dashboard-content admin-workspace-content">
          {children}
        </section>
      </div>
    </main>
  );
}
