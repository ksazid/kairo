import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@kairo/design-tokens/tokens.css";
import "./globals.css";
import "./interaction-review.css";
import "./discovery.css";
import "./ideas.css";
import "./studio.css";
import "./calendar.css";
import "./guided-brain.css";
import { SessionKeepalive } from "./session-keepalive";

export const metadata: Metadata = {
  title: "Kairo — Content Intelligence",
  description: "Content Intelligence for Brands",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SessionKeepalive />
        {children}
      </body>
    </html>
  );
}
