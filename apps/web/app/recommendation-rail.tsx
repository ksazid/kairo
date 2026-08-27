"use client";

import { useRef } from "react";
import { KairoIcon } from "./kairo-icons";
import styles from "./recommendation-rail.module.css";

export function RecommendationRail({ children, count }: { children: React.ReactNode; count: number }) {
  const rail = useRef<HTMLDivElement>(null);
  const move = (direction: -1 | 1) => rail.current?.scrollBy({ left: direction * Math.max(260, rail.current.clientWidth * 0.82), behavior: "smooth" });
  return (
    <div className={styles.frame}>
      <button className={styles.arrow} type="button" aria-label="Show previous recommendations" onClick={() => move(-1)} disabled={count === 0}><KairoIcon name="arrow-left" /></button>
      <div className={styles.rail} ref={rail} tabIndex={0} aria-label="Discover recommendations">{children}</div>
      <button className={styles.arrow} type="button" aria-label="Show next recommendations" onClick={() => move(1)} disabled={count === 0}><KairoIcon name="arrow-right" /></button>
    </div>
  );
}
