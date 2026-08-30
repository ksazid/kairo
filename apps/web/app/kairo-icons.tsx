import type { SVGProps } from "react";

export type KairoIconName =
  | "home" | "create" | "library" | "calendar" | "results" | "brain"
  | "instagram" | "facebook" | "linkedin" | "youtube" | "brand" | "profile" | "settings" | "logout"
  | "plus" | "chevron" | "sun" | "moon" | "system" | "density" | "search" | "bell"
  | "link" | "image" | "photo" | "video" | "media" | "attachment" | "bookmark" | "filter" | "grid" | "list"
  | "arrow-left" | "arrow-right" | "external" | "refresh" | "check" | "warning" | "shield" | "sparkles" | "eye" | "close"
  | "heart" | "comment" | "send" | "more" | "edit" | "device-mobile" | "device-desktop" | "info" | "target" | "lock";

const paths: Record<KairoIconName, React.ReactNode> = {
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
  create: <><path d="M12 3v18M3 12h18"/><path d="m17 5 2 2M5 17l2 2"/></>,
  library: <><path d="M4 5h12a2 2 0 0 1 2 2v13H6a2 2 0 0 1-2-2Z"/><path d="M8 5V3h12v13h-2M8 9h6M8 13h6"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/></>,
  results: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  brain: <><path d="M9.5 4.5A3.5 3.5 0 0 0 6 8v.3A3.6 3.6 0 0 0 4 15a4 4 0 0 0 6 3.5V5.8A2.8 2.8 0 0 0 7.2 3"/><path d="M14.5 4.5A3.5 3.5 0 0 1 18 8v.3a3.6 3.6 0 0 1 2 6.7 4 4 0 0 1-6 3.5V5.8A2.8 2.8 0 0 1 16.8 3M6 8.3c1.7 0 3 1.3 3 3M18 8.3c-1.7 0-3 1.3-3 3M7 17c0-1.7 1.3-3 3-3M17 17c0-1.7-1.3-3-3-3"/></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" stroke="none"/></>,
  facebook: <><circle cx="12" cy="12" r="9"/><path d="M14.5 8H13a2 2 0 0 0-2 2v11M8 13h7"/></>,
  linkedin: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7h.01M12 17v-4a3 3 0 0 1 6 0v4M12 10v7"/></>,
  youtube: <><rect x="2.5" y="6" width="19" height="12" rx="4"/><path d="m10 9 5 3-5 3Z"/></>,
  brand: <><path d="M4 20V7l8-4 8 4v13M8 20v-7h8v7M9 8h.01M15 8h.01"/></>,
  profile: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>,
  system: <><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4"/></>,
  density: <><path d="M4 6h16M4 12h16M4 18h16"/><path d="M7 4v4M12 10v4M17 16v4"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 5"/></>,
  photo: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 5"/></>,
  video: <><rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-2v8l-4-2Z"/></>,
  media: <><rect x="5" y="3" width="16" height="14" rx="2"/><path d="M3 7v12a2 2 0 0 0 2 2h14M8 13l3-3 3 3 2-2 3 3"/></>,
  attachment: <path d="m8 12 6.4-6.4a3 3 0 0 1 4.2 4.2L10 18.4a5 5 0 0 1-7.1-7.1l8.5-8.5"/>,
  bookmark: <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4Z"/>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4"/><circle cx="7" cy="6" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  list: <><path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></>,
  "arrow-left": <><path d="m10 6-6 6 6 6"/><path d="M4 12h16"/></>,
  "arrow-right": <><path d="m14 6 6 6-6 6"/><path d="M4 12h16"/></>,
  external: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></>,
  refresh: <><path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 11M5.5 15A7 7 0 0 0 18 17.5l2-4.5"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  warning: <><path d="M12 3 2.5 20h19Z"/><path d="M12 9v4M12 17h.01"/></>,
  shield: <><path d="M12 2.8 20 6v5.8c0 5.1-3.2 8.2-8 10.2-4.8-2-8-5.1-8-10.2V6l8-3.2Z"/><path d="m8.6 12 2.2 2.2 4.6-4.6"/></>,
  sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z"/><path d="m19 13 .7 2.3L22 16l-2.3.7L19 19l-.7-2.3L16 16l2.3-.7L19 13ZM5 14l.8 2.5L8 17l-2.2.5L5 20l-.8-2.5L2 17l2.2-.5L5 14Z"/></>,
  eye: <><path d="M2.8 12s3.4-5.2 9.2-5.2S21.2 12 21.2 12 17.8 17.2 12 17.2 2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="2.3"/></>,
  close: <><path d="m5 5 14 14M19 5 5 19"/></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>,
  comment: <path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9 9 0 0 1-4-.9L3 21l1.6-4.4A8.5 8.5 0 1 1 21 11.5Z"/>,
  send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/></>,
  "device-mobile": <><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></>,
  "device-desktop": <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></>,
  target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M16 8 21 3M17 3h4v4"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
};

export function KairoIcon({ name, ...props }: { name: KairoIconName } & SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>;
}

export function KairoLogo({ compact = false }: { compact?: boolean }) {
  return <span className={`kairo-logo ${compact ? "compact" : ""}`} aria-label="Kairo"><svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 3a15 15 0 1 0 15 15A15 15 0 0 0 18 3Zm0 6a9 9 0 1 1-9 9 9 9 0 0 1 9-9Z"/><path d="m17 12 7 6-7 6v-4H9v-4h8Z"/></svg>{compact ? null : <span>Kairo</span>}</span>;
}
