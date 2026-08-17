"use client";
import { useRef } from "react";
import type { ChannelAccountGroupView } from "../../../../../src/lib/channel-account-groups-api";

export function GroupDistributionForm({ groups, action }: { groups: ChannelAccountGroupView[]; action: (data: FormData) => void }) {
  const local = useRef<HTMLInputElement>(null);
  const iso = useRef<HTMLInputElement>(null);
  if (!groups.length) return null;
  return <form className="schedule-form" action={action} onSubmit={(event) => {
    const value = local.current?.value;
    if (!value || !iso.current) { event.preventDefault(); return; }
    iso.current.value = new Date(value).toISOString();
  }}>
    <div><strong>Distribute with account group</strong><p>One user action, one independent approval and publish command per destination.</p></div>
    <input ref={iso} type="hidden" name="scheduledForIso" />
    <label>Account group<select name="groupId" required>{groups.map((group) => <option value={group.id} key={group.id}>{group.name} · {group.memberAccountIds.length}</option>)}</select></label>
    <label>Format<select name="contentType" required><option value="text">text</option><option value="image">image</option><option value="video">video</option><option value="carousel">carousel</option><option value="reel">reel</option></select></label>
    <label>Publish time<input ref={local} type="datetime-local" required /></label>
    <button className="primary-button" type="submit">Distribute to group</button>
  </form>;
}
