"use client";
import styles from "../../../flow-pages.module.css";

export default function IdeasError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className={styles.page}><section className={styles.pending}><p className={styles.eyebrow}>Ideas</p><h1>Ideas are temporarily unavailable.</h1><p className={styles.lede}>Your Research and Angle selections have not been changed. Retry when the API is available.</p><div className={styles.actions}><button className={styles.primary} type="button" onClick={() => reset()}>Retry</button><a className={styles.secondary} href="/">Return to Today</a></div></section></main>;
}
