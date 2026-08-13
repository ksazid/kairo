"use client";

import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

async function refreshSession(): Promise<void> {
  await fetch("/session/refresh", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
  }).catch(() => undefined);
}

export function SessionKeepalive() {
  useEffect(() => {
    void refreshSession();
    const interval = window.setInterval(() => void refreshSession(), REFRESH_INTERVAL_MS);
    const refreshWhenActive = () => {
      if (document.visibilityState === "visible") void refreshSession();
    };
    window.addEventListener("focus", refreshWhenActive);
    document.addEventListener("visibilitychange", refreshWhenActive);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenActive);
      document.removeEventListener("visibilitychange", refreshWhenActive);
    };
  }, []);
  return null;
}
