import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(import.meta.dirname,"../..");
const read=(path:string)=>readFileSync(resolve(root,path),"utf8");

describe("VS-80 visual navigation and themes",()=>{
  it("keeps a reusable accessible logo and one navigation icon family",()=>{const icons=read("app/kairo-icons.tsx"),shell=read("app/kairo-product-shell.tsx");expect(icons).toContain("export function KairoLogo");expect(icons).toContain("export function KairoIcon");expect(shell).toContain("destinationIcons");expect(shell).toContain('aria-label="Primary navigation"')});
  it("supports persistent light dark and system themes",()=>{const controls=read("app/shell-controls.tsx"),layout=read("app/layout.tsx"),css=read("app/globals.css");expect(controls).toContain('type Theme="light"|"dark"|"system"');expect(controls).toContain('localStorage.setItem("kairo-theme"');expect(layout).toContain("prefers-color-scheme: dark");expect(css).toContain(':root[data-theme="dark"]')});
  it("uses only the operating-system reduced-motion preference",()=>{const css=read("app/globals.css"),controls=read("app/shell-controls.tsx");expect(css).toContain("@media (prefers-reduced-motion: reduce)");expect(controls).not.toContain("reduced-motion")});
  it("provides Brand switching, breadcrumbs, collapse and mobile Brand context",()=>{const shell=read("app/kairo-product-shell.tsx"),switcher=read("app/brand-switcher.tsx");expect(shell).toContain("<BrandSwitcher");expect(shell).toContain('aria-label="Breadcrumb"');expect(shell).toContain("mobile-brand-bar");expect(shell).toContain("<ShellControls");expect(switcher).toContain("kairo-pinned-brands");expect(switcher).toContain("kairo-recent-brands")});
  it("keeps functional motion short and transform based",()=>{const css=read("app/globals.css");expect(css).toContain("120ms var(--k-ease-out)");expect(css).toContain("transform: scale(.97)");expect(css).not.toContain("transition: all")});
  it("adds fast search, density choice and a replayable guide",()=>{const palette=read("app/command-palette.tsx"),controls=read("app/shell-controls.tsx"),guide=read("app/product-guide.tsx");expect(palette).toContain('event.key.toLowerCase()==="k"');expect(palette).toContain("Find a Brand, Campaign or Content Asset");expect(controls).toContain("kairo-density");expect(guide).toContain("kairo-guide-complete");expect(guide).toContain("ReplayGuideButton")});
});
