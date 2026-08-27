"use client";
import styles from "../../../flow-pages.module.css";

export default function DiscoverError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className={styles.page}><section className={styles.pending}><p className={styles.eyebrow}>Discover</p><h1>Discover is temporarily unavailable.</h1><p className={styles.lede}>Your Brand data has not been changed. Retry the read when the API is available.</p><button className={styles.primary} type="button" onClick={() => reset()}>Retry</button></section></main>;
}
