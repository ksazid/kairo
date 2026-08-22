"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { KairoIcon } from "./kairo-icons";
import { brandHue } from "../src/lib/ui-state-model";
import styles from "./ui-states.module.css";

export type ToastTone = "info" | "success" | "error";
export type ToastInput = { title: string; message?: string; tone?: ToastTone; action?: { label: string; run: () => void } };
type ToastRecord = ToastInput & { id: string };
const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const notify = useCallback((toast: ToastInput) => {
    const id = crypto.randomUUID();
    setToasts(current => [...current, { ...toast, id }].slice(-3));
    window.setTimeout(() => setToasts(current => current.filter(item => item.id !== id)), 5000);
  }, []);
  return <ToastContext.Provider value={notify}>{children}<div className={styles.toastRegion} aria-live="polite" aria-atomic="false">{toasts.map(toast => <div className={styles.toast} data-tone={toast.tone ?? "info"} role={toast.tone === "error" ? "alert" : "status"} key={toast.id}><div><strong>{toast.title}</strong>{toast.message ? <p>{toast.message}</p> : null}{toast.action ? <button className={styles.toastAction} type="button" onClick={() => { toast.action?.run(); setToasts(current => current.filter(item => item.id !== toast.id)); }}>{toast.action.label}</button> : null}</div><button className={styles.close} type="button" onClick={() => setToasts(current => current.filter(item => item.id !== toast.id))} aria-label={`Dismiss ${toast.title}`}>×</button></div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used within ToastProvider");
  return notify;
}

export type ProductNotification = { id: string; title: string; detail: string; occurredAt: string; href?: string; unread?: boolean };
export function NotificationCentre({ notifications, loading = false }: { notifications: ProductNotification[]; loading?: boolean }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const active = notifications.filter(item => item.unread).length;
  useEffect(() => { if (!open) return; const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false); document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [open]);
  return <div className={styles.notificationWrap}><button className={styles.notificationButton} type="button" aria-label={active ? `Notifications, ${active} active` : "Notifications"} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}><KairoIcon name="bell" />{active ? <span className={styles.count} aria-hidden="true">{active > 9 ? "9+" : active}</span> : null}</button>{open ? <section className={styles.panel} id={panelId} aria-label="Notifications"><header className={styles.panelHeader}><h2>Notifications</h2><button className={styles.close} type="button" onClick={() => setOpen(false)} aria-label="Close notifications">×</button></header>{loading ? <div className={styles.empty} aria-busy="true"><Skeleton width="100%" /><Skeleton width="75%" /></div> : notifications.length ? <ul className={styles.notificationList}>{notifications.map(item => <li key={item.id}>{item.href ? <Link className={styles.notification} data-unread={item.unread} href={item.href}><NotificationCopy item={item} /></Link> : <div className={styles.notification} data-unread={item.unread}><NotificationCopy item={item} /></div>}</li>)}</ul> : <p className={styles.empty}>No notifications yet. Publishing and connection updates will appear here.</p>}</section> : null}</div>;
}
function NotificationCopy({ item }: { item: ProductNotification }) { return <><strong>{item.title}</strong><span>{item.detail}</span><small>{item.occurredAt}</small></>; }

export function Skeleton({ width = "100%", height = ".875rem", label = "Loading" }: { width?: CSSProperties["width"]; height?: CSSProperties["height"]; label?: string }) { return <span className={styles.skeleton} style={{ width, height }} role="status"><span className={styles.srOnly}>{label}</span></span>; }
export function SkeletonGroup({ rows = 3, label = "Loading content" }: { rows?: number; label?: string }) { return <div className={styles.skeletonGroup} aria-busy="true" aria-label={label}>{Array.from({ length: rows }, (_, index) => <Skeleton key={index} width={index === rows - 1 ? "68%" : "100%"} />)}</div>; }

export type Channel = "instagram" | "facebook";
export type ChannelHealth = "healthy" | "attention" | "disconnected" | "unknown";
const healthCopy: Record<ChannelHealth, string> = { healthy: "Connected", attention: "Needs attention", disconnected: "Disconnected", unknown: "Status unavailable" };
export function ChannelHealthLabel({ channel, health }: { channel: Channel; health: ChannelHealth }) { const name = channel === "instagram" ? "Instagram" : "Facebook"; return <span className={styles.channel}><KairoIcon name={channel} /><span>{name}</span><span className={styles.health} data-health={health} aria-hidden="true" /><span className={styles.srOnly}>{healthCopy[health]}</span></span>; }

export function BrandAccent({ brandId, name }: { brandId: string; name: string }) { const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]?.toUpperCase()).join("") || "B"; const style = useMemo(() => ({ "--brand-hue": brandHue(brandId) } as CSSProperties), [brandId]); return <span className={styles.brandAccent} style={style} aria-hidden="true">{initials}</span>; }
