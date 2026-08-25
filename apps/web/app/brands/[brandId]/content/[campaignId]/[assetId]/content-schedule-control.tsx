"use client";

import { useRef } from "react";
import type { ChannelAccountView } from "../../../../../../src/lib/kairo-api";
import { KairoIcon } from "../../../../../kairo-icons";
import styles from "./content-detail.module.css";

type ContentType = "text" | "image" | "video" | "carousel";

export function ContentScheduleControl({
  account,
  contentType,
  action,
}: {
  account: ChannelAccountView;
  contentType: ContentType;
  action: (data: FormData) => void;
}) {
  const local = useRef<HTMLInputElement>(null);
  const iso = useRef<HTMLInputElement>(null);

  return (
    <details className={styles.scheduleControl}>
      <summary><KairoIcon name="calendar" /><span>Schedule</span><span className={styles.scheduleChevron}>⌄</span></summary>
      <div className={styles.schedulePopover}>
        <strong>Schedule for later</strong>
        <small>{account.displayName}</small>
        <form
          action={action}
          onSubmit={(event) => {
            const value = local.current?.value;
            if (!value || !iso.current) {
              event.preventDefault();
              return;
            }
            iso.current.value = new Date(value).toISOString();
          }}
        >
          <input type="hidden" name="channelAccountId" value={account.id} />
          <input type="hidden" name="contentType" value={contentType} />
          <input type="hidden" name="publishMode" value="schedule" />
          <input ref={iso} type="hidden" name="scheduledForIso" />
          <label>
            Publish time
            <input ref={local} type="datetime-local" required />
          </label>
          <button type="submit">Add to Calendar</button>
        </form>
      </div>
    </details>
  );
}
