"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import {
  apiUrl,
  clearStoredAuth,
  ensureAccessToken,
  fetchWithAuth,
  storeAuth,
  type AuthenticatedUser,
  type UserRole,
} from "@/app/lib/auth-client";
import s from "./portal-auth.module.css";

type Portal = "user" | "nutritionist" | "admin";

type LoginSectionProps = {
  adminOnly?: boolean;
};

const portalCopy: Record<Portal, { title: string; description: string }> = {
  user: {
    title: "Your care, in one place.",
    description:
      "Return to your plan, progress and the next considered step in your care.",
  },
  nutritionist: {
    title: "Guide care with clarity.",
    description:
      "Review programmes, notes and the people entrusted to your care.",
  },
  admin: {
    title: "Keep the practice considered.",
    description:
      "Regulate account access and keep every workspace moving in the right direction.",
  },
};

function UserPortalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19c.75-3.15 3.05-4.75 6.5-4.75s5.75 1.6 6.5 4.75" />
    </svg>
  );
}

function NutritionistPortalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20V8.5" />
      <path d="M12 11.5C8.1 11.5 5.4 9.6 5.4 6c3.9 0 6.6 1.85 6.6 5.5Z" />
      <path d="M12 15.2c3.85 0 6.6-1.9 6.6-5.5-3.9 0-6.6 1.85-6.6 5.5Z" />
      <path d="M8.5 20h7" />
    </svg>
  );
}

function AdminPortalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 19 6v5.3c0 4.1-2.55 7.55-7 9.2-4.45-1.65-7-5.1-7-9.2V6l7-2.5Z" />
      <path d="m9.3 12 1.8 1.8 3.7-4" />
    </svg>
  );
}

function dashboardPathForRole(role: UserRole) {
  return role === "admin"
    ? "/admin/dashboard"
    : role === "nutritionist"
      ? "/nutritionist/dashboard"
      : "/user/dashboard";
}

export function LoginSection({ adminOnly = false }: LoginSectionProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPortal, setSelectedPortal] = useState<Portal>(
    adminOnly ? "admin" : "user",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<AuthenticatedUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function restoreSession() {
      const token = await ensureAccessToken();

      if (!token || cancelled) {
        return;
      }

      try {
        const response = await fetchWithAuth(`${apiUrl}/auth/me`, { signal: controller.signal });

        if (!response.ok) {
          clearStoredAuth();
          return;
        }

        const body = (await response.json()) as {
          user: AuthenticatedUser;
        };

        if (!cancelled) {
          setSession(body.user);
          router.replace(dashboardPathForRole(body.user.role));
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.warn("Existing session could not be restored.", error instanceof Error ? error.name : "UnknownError");
        // The sign-in form remains available when the session cannot be restored.
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSession(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, role: selectedPortal }),
      });

      const body = (await response.json().catch(() => null)) as
        | { accessToken: string; user: AuthenticatedUser }
        | { message?: string }
        | null;

      if (!response.ok || !body || !("accessToken" in body)) {
        const message =
          body && "message" in body
            ? Array.isArray(body.message)
              ? body.message.join(" ")
              : body.message
            : "We could not sign you in. Please check your details.";
        throw new Error(message || "We could not sign you in.");
      }

      storeAuth(body);
      setSession(body.user);
      router.push(dashboardPathForRole(body.user.role));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The sign-in service is unavailable right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    const token = await ensureAccessToken();

    clearStoredAuth();
    setSession(null);
    router.replace("/login");

    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch {
      console.warn("Logout request did not complete after the local session was cleared.");
    }
  }

  function selectPortal(portal: Portal) {
    setSelectedPortal(portal);
    setError("");
  }

  return (
    <main className={`login-section ${s.page}`} id="login">
      <div className="portal-login-shell">
        <section className="portal-login-brand-panel" aria-labelledby="login-hero-title">
          <div className="portal-login-panel-top">
            <Link className="portal-login-brand" href="/" aria-label="Deepti Sherawat home">
              <Image src="/deepa-chakra-small.svg" width={38} height={38} alt="" />
              <span>
                <strong>DEEPTI SHERAWAT</strong>
                <small>Nutritionist · Ayurveda · Modern science</small>
              </span>
            </Link>
            <span className="portal-login-mark" aria-hidden="true">
              दीप
            </span>
          </div>

          <div className="portal-login-hero-copy">
            <p className="portal-login-kicker">THE DEEPA CHAKRA / 01</p>
            <h1 id="login-hero-title">
              Do justice to
              <em>your body.</em>
            </h1>
            <p>
              Supervised nutrition programmes rooted in Ayurveda and measured
              with modern diagnostics — held in one calm, connected space.
            </p>
          </div>

          <div className="portal-login-points" aria-label="Care approach">
            <div>
              <span>01</span>
              <strong>Understand</strong>
              <small>Start with the whole picture.</small>
            </div>
            <div>
              <span>02</span>
              <strong>Tend</strong>
              <small>Make the next step practical.</small>
            </div>
            <div>
              <span>03</span>
              <strong>Measure</strong>
              <small>Let progress guide the plan.</small>
            </div>
          </div>
        </section>

        <section className="portal-login-auth-panel" aria-labelledby="login-form-title">
          <div className="portal-login-auth-top">
            <span>WELCOME BACK</span>
            <Link href={adminOnly ? "/login" : "/"}>
              {adminOnly ? "Back to sign in" : "Back to site"} <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="portal-login-card">
            <div className="portal-login-card-heading">
              <p className="portal-login-eyebrow">SIGN IN SECURELY</p>
              <h2 id="login-form-title">{portalCopy[selectedPortal].title}</h2>
              <p>{portalCopy[selectedPortal].description}</p>
            </div>

            {adminOnly ? (
              <div className="portal-login-admin-entry">
                <span className="portal-tab-icon">
                  <AdminPortalIcon />
                </span>
                <span>
                  <strong>Admin regulator portal</strong>
                  <small>Manage access and oversee the practice.</small>
                </span>
              </div>
            ) : (
              <div className="portal-login-switch" role="group" aria-label="Choose your portal">
                <button
                  className={selectedPortal === "user" ? "portal-tab-selected" : ""}
                  type="button"
                  aria-pressed={selectedPortal === "user"}
                  onClick={() => selectPortal("user")}
                >
                  <span className="portal-tab-icon">
                    <UserPortalIcon />
                  </span>
                  User portal
                </button>
                <button
                  className={selectedPortal === "nutritionist" ? "portal-tab-selected" : ""}
                  type="button"
                  aria-pressed={selectedPortal === "nutritionist"}
                  onClick={() => selectPortal("nutritionist")}
                >
                  <span className="portal-tab-icon">
                    <NutritionistPortalIcon />
                  </span>
                  Nutritionist
                </button>
              </div>
            )}

            {!session && (
              <form className="portal-login-form" onSubmit={handleSubmit}>
                <div className="form-field">
                  <label htmlFor="login-email">Email address</label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="login-password">Password</label>
                  <div className="portal-password-wrap">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <button
                      className="portal-password-toggle"
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button className="portal-login-submit" type="submit" disabled={isLoading}>
                  {isLoading ? "Checking your access…" : "Continue securely"}
                  {!isLoading && <span aria-hidden="true">→</span>}
                </button>
              </form>
            )}

            {error && (
              <p className="portal-login-message portal-login-error" role="alert">
                {error}
              </p>
            )}

            {session && (
              <div className="portal-login-message portal-login-success" role="status">
                <strong>{session.name}</strong>
                <span>
                  {session.role === "admin"
                    ? "Admin regulator"
                    : session.role === "nutritionist"
                      ? "Nutritionist"
                      : "Normal user"} access verified.
                </span>
                <button className="login-signout" type="button" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            )}

            <p className="portal-login-note">
              {adminOnly
                ? "Only admin regulator accounts can enter this workspace. Use the shared sign-in for user or nutritionist access."
                : "Choose your account type before signing in. Your portal access is checked securely."}
            </p>
            {!adminOnly && (
              <p className="portal-login-account-link">
                New here? <Link href="/signup">Create a user account <span aria-hidden="true">↗</span></Link>
              </p>
            )}
          </div>

          <div className="portal-login-footer">
            <span className="portal-login-check" aria-hidden="true">✓</span>
            Private by design
            <span className="portal-login-divider" aria-hidden="true" />
            Need an invitation? Contact the practice.
          </div>
        </section>
      </div>
    </main>
  );
}
