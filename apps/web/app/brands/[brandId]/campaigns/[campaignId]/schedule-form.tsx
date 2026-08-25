"use client";

import { useRef } from "react";
import type { ChannelAccountView } from "../../../../../src/lib/kairo-api";
import { immediatePublishContentType } from "../../../../../src/lib/immediate-publish";

type WebPublishContentType = "text" | "image" | "video" | "carousel";

export function ScheduleForm({ account, action }: { account: ChannelAccountView; action: (data: FormData) => void }) {
  const local = useRef<HTMLInputElement>(null);
  const iso = useRef<HTMLInputElement>(null);
  const capabilities = account.capabilities.map((value) => value.replace("publish-", "") as WebPublishContentType);
  const publishNowContentType = immediatePublishContentType(account.channel, capabilities);

  return (
    <div className="schedule-form">
      <div>
        <strong>Publish approved content</strong>
        <p>{account.displayName} · {friendlyChannel(account.channel)}</p>
      </div>

      {publishNowContentType ? (
        <form action={action} aria-label={`Publish now to ${account.displayName}`}>
          <input type="hidden" name="channelAccountId" value={account.id} />
          <input type="hidden" name="contentType" value={publishNowContentType} />
          <input type="hidden" name="publishMode" value="now" />
          <button className="primary-button" type="submit">Publish now</button>
          <p>Kairo will show Published only after the destination confirms it.</p>
        </form>
      ) : null}

      <details className="studio-context-disclosure">
        <summary>
          <span>
            <strong>Schedule for later</strong>
            <small>Choose an exact future time and add it to your Calendar.</small>
          </span>
          <span className="context-summary-action">Open</span>
        </summary>
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
          <input type="hidden" name="publishMode" value="schedule" />
          <input ref={iso} type="hidden" name="scheduledForIso" />
          <label>
            Format
            <select name="contentType" required>
              {capabilities.map((value) => <option value={value} key={value}>{friendlyFormat(value)}</option>)}
            </select>
          </label>
          <label>
            Publish time
            <input ref={local} type="datetime-local" required />
          </label>
          <button className="secondary-button" type="submit">Add to Calendar</button>
        </form>
      </details>
    </div>
  );
}

function friendlyChannel(value: string) {
  if (value.toLowerCase() === "youtube") return "YouTube";
  if (value.toLowerCase() === "linkedin") return "LinkedIn";
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function friendlyFormat(value: string) {
  if (value === "image") return "Post";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
