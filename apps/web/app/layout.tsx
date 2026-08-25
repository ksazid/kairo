import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "@kairo/design-tokens/tokens.css";
import "./globals.css";
import "./shell-baseline.css";
import "./approved-mobile-shell.css";
import "./approved-portrait-shell.css";
import "./interaction-review.css";
import "./discovery.css";
import "./ideas.css";
import "./studio.css";
import "./video-studio.css";
import "./simple-create.css";
import "./calendar.css";
import "./guided-brain.css";
import "./approved-home-pixel-tuning.css";
import { SessionKeepalive } from "./session-keepalive";
import { ToastProvider } from "./ui-states";

const contentInter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--k-content-inter",
});

export const metadata: Metadata = {
  title: "Kairo — Content Intelligence",
  description: "Content Intelligence for Brands",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const t=localStorage.getItem('kairo-theme');const r=t==='dark'||t==='light'?t:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=r;document.documentElement.style.colorScheme=r}catch{}})()`,
          }}
        />
      </head>
      <body className={contentInter.variable}>
        <SessionKeepalive />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
