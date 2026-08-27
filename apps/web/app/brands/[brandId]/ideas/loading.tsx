import styles from "../../../flow-pages.module.css";
export default function IdeasLoading() {
  return <main className={styles.page} aria-busy="true" aria-live="polite"><section className={styles.pending}><p className={styles.eyebrow}>Ideas</p><h1>Loading evidence-backed work…</h1><p className={styles.lede}>Checking Idea lineage, Research and candidate Angles for this Brand.</p></section></main>;
}
