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
        <strong>Publish approved version</strong>
        <p>{account.displayName} · {account.channel} · {account.accountRef}</p>
      </div>

      {publishNowContentType ? (
        <form action={action} aria-label={`Publish now to ${account.displayName}`}>
          <input type="hidden" name="channelAccountId" value={account.id} />
          <input type="hidden" name="contentType" value={publishNowContentType} />
          <input type="hidden" name="publishMode" value="now" />
          <button className="success-button" type="submit">Publish now</button>
          <p>The approved version is queued immediately through Kairo's normal publishing worker. Success is shown only after the channel confirms publication.</p>
        </form>
      ) : null}

      <details className="studio-context-disclosure">
        <summary>
          <span>
            <strong>Schedule for later</strong>
            <small>Keep the existing calendar flow available when you want an exact future time.</small>
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
              {capabilities.map((value) => <option value={value} key={value}>{value}</option>)}
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
