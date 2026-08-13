"use client";

import { useEffect } from "react";
import { refreshKairoSession } from "./session-actions";

export function SessionKeepalive() {
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (!active || document.visibilityState === "hidden") return;
      await refreshKairoSession().catch(() => false);
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5 * 60 * 1000);
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return null;
}
