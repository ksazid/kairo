"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KairoIcon } from "./kairo-icons";
import { BrandAccent } from "./ui-states";

type BrandChoice = { id: string; workspaceId: string; name: string };

export function BrandSwitcher({
  brands,
  currentBrandId,
  addBrandHref,
  compact = false,
}: {
  brands: BrandChoice[];
  currentBrandId?: string | null;
  addBrandHref: string;
  compact?: boolean;
}) {
  const [pinned, setPinned] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setPinned(read("kairo-pinned-brands"));
    setRecent(read("kairo-recent-brands"));
  }, []);

  const current = brands.find((brand) => brand.id === currentBrandId);
  const ordered = useMemo(
    () => [...brands].sort((a, b) => rank(b.id, pinned, recent) - rank(a.id, pinned, recent)),
    [brands, pinned, recent],
  );

  function visit(id: string) {
    const next = [id, ...recent.filter((value) => value !== id)].slice(0, 5);
    setRecent(next);
    localStorage.setItem("kairo-recent-brands", JSON.stringify(next));
  }

  function pin(id: string) {
    const next = pinned.includes(id) ? pinned.filter((value) => value !== id) : [...pinned, id];
    setPinned(next);
    localStorage.setItem("kairo-pinned-brands", JSON.stringify(next));
  }

  return (
    <details className={`brand-switcher ${compact ? "compact" : ""}`}>
      <summary title="Switch Brand">
        <BrandAccent brandId={current?.id ?? "brand"} name={current?.name ?? "Brand"} />
        <span className="brand-switcher-copy">
          <small>Current Brand</small>
          <strong>{current?.name ?? "Select Brand"}</strong>
        </span>
        <KairoIcon name="chevron" />
      </summary>
      <div className="brand-switcher-menu">
        <p>Switch Brand</p>
        {ordered.map((brand) => {
          const isPinned = pinned.includes(brand.id);
          return (
            <div className="brand-switcher-row" key={brand.id}>
              <Link
                href={`/?workspace=${encodeURIComponent(brand.workspaceId)}&brand=${encodeURIComponent(brand.id)}`}
                onClick={() => visit(brand.id)}
                aria-current={brand.id === currentBrandId ? "true" : undefined}
              >
                <BrandAccent brandId={brand.id} name={brand.name} />
                <span>{brand.name}</span>
                {brand.id === currentBrandId ? <small>Current</small> : recent.includes(brand.id) ? <small>Recent</small> : null}
              </Link>
              <button
                type="button"
                onClick={() => pin(brand.id)}
                aria-pressed={isPinned}
                title={isPinned ? `Unpin ${brand.name}` : `Pin ${brand.name}`}
              >
                <KairoIcon name="bookmark" />
                <span className="sr-only">{isPinned ? "Unpin" : "Pin"} {brand.name}</span>
              </button>
            </div>
          );
        })}
        <Link href={addBrandHref}>
          <KairoIcon name="plus" />
          <span>Add Brand</span>
        </Link>
      </div>
    </details>
  );
}

function read(key: string) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function rank(id: string, pinned: string[], recent: string[]) {
  const pinIndex = pinned.indexOf(id);
  const recentIndex = recent.indexOf(id);
  return (pinIndex < 0 ? 0 : 100 - pinIndex) + (recentIndex < 0 ? 0 : 20 - recentIndex);
}
