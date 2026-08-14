"use client";

import { FormEvent, useState } from "react";
import { createAuthClient } from "@neondatabase/auth/next";

const authClient = createAuthClient();

type AuthFormProps = {
  creating: boolean;
  initialError?: string;
};

export function AuthForm({ creating, initialError }: AuthFormProps) {
  const [error, setError] = useState(initialError ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

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
      <form onSubmit={submit} className="onboarding-form">
        {creating ? <label>Name<input name="name" required maxLength={120} autoComplete="name" /></label> : null}
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" required minLength={8} autoComplete={creating ? "new-password" : "current-password"} /></label>
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? (creating ? "Creating account…" : "Signing in…") : (creating ? "Create account" : "Sign in")}
        </button>
      </form>
    </>
  );
}
