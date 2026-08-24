"use client";

import Link from "next/link";
import { KairoIcon } from "./kairo-icons";

export function ProfileMenu({ addBrandHref }: { addBrandHref: string }) {
  return (
    <details className="profile-menu">
      <summary aria-label="Open profile and settings" title="Profile and settings">
        <KairoIcon name="profile" />
      </summary>
      <div className="profile-menu-panel">
        <div className="profile-menu-heading">
          <strong>Profile</strong>
          <span>Settings and account</span>
        </div>
        <nav aria-label="Profile actions">
          <Link href={addBrandHref}><KairoIcon name="plus" /><span>Add Brand</span></Link>
          <Link href="/settings"><KairoIcon name="settings" /><span>Settings</span></Link>
          <a href="/auth/logout"><KairoIcon name="logout" /><span>Sign out</span></a>
        </nav>
      </div>
    </details>
  );
}
