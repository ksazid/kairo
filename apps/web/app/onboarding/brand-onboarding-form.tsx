"use client";

import { useFormStatus } from "react-dom";
import styles from "./onboarding.module.css";

type BrandOnboardingFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  submitLabel?: string;
};

export function BrandOnboardingForm({ action, error, submitLabel = "Build my Brand" }: BrandOnboardingFormProps) {
  return (
    <form action={action} className={styles.brandForm}>
      <label className={styles.urlField}>
        <span>Public Brand URL</span>
        <input
          name="brandUrl"
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="yourbrand.com or instagram.com/yourbrand"
          required
          aria-describedby="brand-url-help"
        />
        <small id="brand-url-help">Website, Instagram, LinkedIn, YouTube, product page, blog or another public page.</small>
      </label>
      {error ? <p className={styles.formError} role="alert">{error}</p> : null}
      <SubmitState label={submitLabel} />
    </form>
  );
}

function SubmitState({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button className={`${styles.primaryAction} primary-button`} type="submit" disabled={pending} aria-disabled={pending}>
        <span>{pending ? "Learning your Brand…" : label}</span>
        <span className={styles.buttonArrow} aria-hidden="true">→</span>
      </button>
      <div className={`${styles.learningState} ${pending ? styles.learningStateVisible : ""}`} aria-live="polite" aria-hidden={!pending}>
        <span className={styles.learningPulse} aria-hidden="true"><i /><i /><i /></span>
        <div>
          <strong>Kairo is learning from your reference</strong>
          <p>Understanding your Brand, audience, voice and content direction.</p>
        </div>
      </div>
    </>
  );
}
