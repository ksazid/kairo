import styles from "../../../flow-pages.module.css";
export default function DiscoverLoading() {
  return <main className={styles.page} aria-busy="true" aria-live="polite"><section className={styles.pending}><p className={styles.eyebrow}>Discover</p><h1>Finding what matters now…</h1><p className={styles.lede}>Loading ranked Opportunities and their evidence state.</p><div className={styles.card}><span className={`${styles.chip} ${styles.chipNeutral}`}>Loading</span><h2>Preparing Brand-relevant opportunities</h2></div></section></main>;
}
