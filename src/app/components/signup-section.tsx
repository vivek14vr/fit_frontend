"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import {
  apiUrl,
  storeAuth,
  type AuthResponse,
} from "@/app/lib/auth-client";
import s from "./portal-auth.module.css";

function getErrorMessage(body: { message?: string | string[] } | null) {
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message || "We could not create your account. Please try again.";
}

export function SignupSection() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const passwordsMismatch = Boolean(confirmPassword) && password !== confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const body = (await response.json().catch(() => null)) as
        | (AuthResponse & { message?: string | string[] })
        | { message?: string | string[] }
        | null;

      if (!response.ok || !body || !("accessToken" in body) || !("user" in body)) {
        throw new Error(getErrorMessage(body));
      }

      storeAuth({ accessToken: body.accessToken, user: body.user });
      router.replace("/user/dashboard");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The sign-up service is unavailable right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className={`login-section ${s.page}`} id="signup">
      <div className="portal-login-shell">
        <section className="portal-login-brand-panel" aria-labelledby="signup-hero-title">
          <div className="portal-login-panel-top">
            <Link className="portal-login-brand" href="/" aria-label="Deepti Sherawat home">
              <Image src="/deepa-chakra-small.svg" width={38} height={38} alt="" />
              <span>
                <strong>DEEPTI SHERAWAT</strong>
                <small>Nutritionist · Ayurveda · Modern science</small>
              </span>
            </Link>
            <span className="portal-login-mark" aria-hidden="true">दीप</span>
          </div>

          <div className="portal-login-hero-copy">
            <p className="portal-login-kicker">YOUR CARE SPACE / 01</p>
            <h1 id="signup-hero-title">
              Begin with
              <em>one considered step.</em>
            </h1>
            <p>
              Create your private user space to receive forms, record your progress,
              and stay connected to the next useful step in your care.
            </p>
          </div>

          <div className="portal-login-points" aria-label="What your space includes">
            <div><span>01</span><strong>Receive</strong><small>Your care plan.</small></div>
            <div><span>02</span><strong>Record</strong><small>Your daily rhythm.</small></div>
            <div><span>03</span><strong>Review</strong><small>Your progress.</small></div>
          </div>
        </section>

        <section className="portal-login-auth-panel" aria-labelledby="signup-form-title">
          <div className="portal-login-auth-top">
            <span>WELCOME IN</span>
            <Link href="/login">Back to sign in <span aria-hidden="true">↗</span></Link>
          </div>

          <div className="portal-login-card portal-signup-card">
            <div className="portal-login-card-heading">
              <p className="portal-login-eyebrow">CREATE YOUR USER SPACE</p>
              <h2 id="signup-form-title">Start your care journey.</h2>
              <p>Your email will be your login ID. You can change your password later from your profile.</p>
            </div>

            <form className="portal-login-form" onSubmit={handleSubmit} noValidate>
              <div className="form-field">
                <label htmlFor="signup-name">Your name</label>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="signup-email">Email address</label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <small className="portal-field-help">This is your login ID.</small>
              </div>

              <div className="form-field">
                <label htmlFor="signup-password">Create password</label>
                <div className="portal-password-wrap">
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
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
                <small className="portal-field-help">Use at least 8 characters.</small>
              </div>

              <div className="form-field">
                <label htmlFor="signup-confirm-password">Confirm password</label>
                <div className="portal-password-wrap">
                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    aria-invalid={passwordsMismatch}
                    aria-describedby={passwordsMismatch ? "signup-password-error" : undefined}
                    required
                  />
                  <button
                    className="portal-password-toggle"
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {passwordsMismatch && <small className="portal-field-error" id="signup-password-error">Passwords do not match.</small>}
              </div>

              <button className="portal-login-submit" type="submit" disabled={isLoading}>
                {isLoading ? "Creating your space…" : "Create user account"}
                {!isLoading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            {error && <p className="portal-login-message portal-login-error" role="alert">{error}</p>}
            <p className="portal-login-note">Your account starts as a private user portal. A nutritionist or admin can connect your care plan later.</p>
          </div>

          <div className="portal-login-footer">
            <span className="portal-login-check" aria-hidden="true">✓</span>
            Private by design
            <span className="portal-login-divider" aria-hidden="true" />
            Already have an account? <Link href="/login">Sign in</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
