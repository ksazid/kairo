"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { KairoIcon } from "./kairo-icons";
import type { HomeCreationFormat } from "../src/lib/home-creation-format";
import styles from "./home-vs85.module.css";

const options: Array<[HomeCreationFormat | "campaign", string, "image" | "video"]> = [
  ["image", "Post", "image"],
  ["reel", "Reel", "video"],
  ["carousel", "Carousel", "image"],
  ["campaign", "Campaign", "video"],
];

export function HomeFormatPicker({ selected }: { selected?: HomeCreationFormat | "campaign" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return <div className={styles.formatPicker} role="group" aria-label="Choose what to create">
    {options.map(([value, label, icon]) => <button key={value} type="button" aria-pressed={selected === value} className={selected === value ? styles.formatChoiceActive : styles.formatChoice} onClick={() => {
      const next = new URLSearchParams(params.toString());
      next.set("format", value);
      router.push(`${pathname}?${next.toString()}`);
    }}><KairoIcon name={icon} /><span>{label}</span></button>)}
  </div>;
}
