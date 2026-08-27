"use client";

import { useEffect, useState } from "react";
import styles from "./for-you-select-checkbox.module.css";

export function ForYouSelectCheckbox({ id, title }: { id: string; title: string }) {
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const clear = () => setChecked(false);
    window.addEventListener("kairo:for-you-selection-cleared", clear);
    return () => window.removeEventListener("kairo:for-you-selection-cleared", clear);
  }, []);
  return <input className={styles.checkbox} type="checkbox" aria-label={`Select ${title}`} checked={checked} onChange={(event) => {
    const next = event.target.checked;
    setChecked(next);
    window.dispatchEvent(new CustomEvent("kairo:for-you-selection", { detail: { id, selected: next } }));
  }} />;
}
