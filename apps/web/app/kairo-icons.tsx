import type { SVGProps } from "react";

export type KairoIconName = "home"|"create"|"library"|"calendar"|"results"|"brain"|"instagram"|"facebook"|"brand"|"profile"|"settings"|"logout"|"plus"|"chevron"|"sun"|"moon"|"system"|"density"|"search"|"bell";

const paths:Record<KairoIconName,React.ReactNode>={
  home:<><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
  create:<><path d="M12 3v18M3 12h18"/><path d="m17 5 2 2M5 17l2 2"/></>,
  library:<><path d="M4 5h12a2 2 0 0 1 2 2v13H6a2 2 0 0 1-2-2Z"/><path d="M8 5V3h12v13h-2M8 9h6M8 13h6"/></>,
  calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/></>,
  results:<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  brain:<><path d="M9.5 4.5A3.5 3.5 0 0 0 6 8v.3A3.6 3.6 0 0 0 4 15a4 4 0 0 0 6 3.5V5.8A2.8 2.8 0 0 0 7.2 3"/><path d="M14.5 4.5A3.5 3.5 0 0 1 18 8v.3a3.6 3.6 0 0 1 2 6.7 4 4 0 0 1-6 3.5V5.8A2.8 2.8 0 0 1 16.8 3M6 8.3c1.7 0 3 1.3 3 3M18 8.3c-1.7 0-3 1.3-3 3M7 17c0-1.7 1.3-3 3-3M17 17c0-1.7-1.3-3-3-3"/></>,
  instagram:<><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" stroke="none"/></>,
  facebook:<><circle cx="12" cy="12" r="9"/><path d="M14.5 8H13a2 2 0 0 0-2 2v11M8 13h7"/></>,
  brand:<><path d="M4 20V7l8-4 8 4v13M8 20v-7h8v7M9 8h.01M15 8h.01"/></>,
  profile:<><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
  settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  logout:<><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/></>, plus:<path d="M12 5v14M5 12h14"/>, chevron:<path d="m9 18 6-6-6-6"/>,
  sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon:<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>,
  system:<><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4"/></>,
  density:<><path d="M4 6h16M4 12h16M4 18h16"/><path d="M7 4v4M12 10v4M17 16v4"/></>,
  search:<><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>
};
export function KairoIcon({name,...props}:{name:KairoIconName}&SVGProps<SVGSVGElement>){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>}
export function KairoLogo({compact=false}:{compact?:boolean}){return <span className={`kairo-logo ${compact?"compact":""}`} aria-label="Kairo"><svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 3a15 15 0 1 0 15 15A15 15 0 0 0 18 3Zm0 6a9 9 0 1 1-9 9 9 9 0 0 1 9-9Z"/><path d="m17 12 7 6-7 6v-4H9v-4h8Z"/></svg>{compact?null:<span>Kairo</span>}</span>}
