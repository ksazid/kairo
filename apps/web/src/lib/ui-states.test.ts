import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { brandHue } from "./ui-state-model";

const source = readFileSync(new URL("../../app/ui-states.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../../app/ui-states.module.css", import.meta.url), "utf8");

describe("reusable product UI states", () => {
  it("provides deterministic Brand accents", () => {
    expect(brandHue("brand-1")).toBe(brandHue("brand-1"));
    expect(brandHue("brand-1")).not.toBe(brandHue("brand-2"));
  });
  it("announces truthful toast and notification states", () => {
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("No notifications yet");
    expect(source).toContain('event.key === "Escape"');
    expect(source).not.toContain("sample notification");
    expect(source).toContain("toast.action?.run()");
    expect(source).toContain("Dismiss ${toast.title}");
  });
  it("labels channel health without relying on colour", () => {
    expect(source).toContain('Status unavailable');
    expect(source).toContain('className={styles.srOnly}>{healthCopy[health]}');
  });
  it("respects system motion preference and mobile safe areas", () => {
    expect(css).toContain("prefers-reduced-motion:reduce");
    expect(css).toContain("env(safe-area-inset-bottom)");
    expect(css).toContain(":focus-visible");
  });
  it("provides labelled skeleton loading instead of blank pages", () => {
    expect(source).toContain('aria-busy="true"');
    expect(source).toContain('label = "Loading content"');
  });
});
