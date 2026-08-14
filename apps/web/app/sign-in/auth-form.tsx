"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createAuthClient } from "@neondatabase/auth/next";

const authClient = createAuthClient();

type AuthFormProps = {
  creating: boolean;
  initialError?: string;
};

export function AuthForm({ creating, initialError }: AuthFormProps) {
  const [error, setError] = useState(initialError ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  async function signInWithGoogle() {
    if (submitting || googleSubmitting) return;

    setGoogleSubmitting(true);
    setError("");

    try {
      const origin = window.location.origin;
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${origin}/session/bootstrap`,
        newUserCallbackURL: `${origin}/session/bootstrap`,
        errorCallbackURL: `${origin}/sign-in?error=Google%20sign-in%20failed`,
      });

      if (result?.error) {
        setError(result.error.message ?? "Google sign-in failed");
        setGoogleSubmitting(false);
      }
    } catch {
      setError("Google sign-in is unavailable. Please try again.");
      setGoogleSubmitting(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || googleSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    if (!email || !password || (creating && !name)) {
      setError("Missing required fields");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = creating
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? "Authentication failed");
        return;
      }

      window.location.assign("/session/bootstrap");
    } catch {
      setError("Authentication service unavailable. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {error ? <p className="notice error" role="alert">{error}</p> : null}

      <button
        className="secondary-button auth-social-button"
        type="button"
        onClick={signInWithGoogle}
        disabled={submitting || googleSubmitting}
      >
        <span className="google-mark" aria-hidden="true">G</span>
        {googleSubmitting ? "Connecting to Google…" : "Continue with Google"}
      </button>

      <div className="auth-divider" aria-hidden="true"><span>or</span></div>

      <form onSubmit={submit} className="onboarding-form auth-credentials-form">
        {creating ? <label>Name<input name="name" required maxLength={120} autoComplete="name" /></label> : null}
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" required minLength={8} autoComplete={creating ? "new-password" : "current-password"} /></label>
        <button className="primary-button" type="submit" disabled={submitting || googleSubmitting}>
          {submitting ? (creating ? "Creating account…" : "Signing in…") : (creating ? "Create account" : "Sign in")}
        </button>
      </form>
    </>
  );
}
