import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@kairo/design-tokens/tokens.css";
import "./globals.css";
import "./interaction-review.css";

export const metadata: Metadata = {
  title: "Kairo — Content Intelligence",
  description: "Content Intelligence for Brands",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
