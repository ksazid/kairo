import Link from "next/link";
import { MEDIA_PROVIDERS, PRIMARY_MEDIA_KINDS, SECONDARY_MEDIA_KINDS, type MediaProviderKind } from "../provider-catalog";
import { SettingsShell } from "../settings-shell";

export default async function MediaProvidersPage() {
  return (
    <SettingsShell
      active="media-providers"
      title="Media Providers"
      description="Configure the providers Kairo uses for images, video, voice, music, and lip-sync."
    >
      <ProviderGroup title="Primary Capability" description="Default providers for image and video generation." kinds={PRIMARY_MEDIA_KINDS} />
      <ProviderGroup title="Available Via Provider" description="Additional media capabilities available to Kairo." kinds={SECONDARY_MEDIA_KINDS} />

      <div className="settings-inline-note" role="status">
        <strong>Runtime provider validation is not connected yet.</strong>
        <p>The approved provider choices and defaults are visible now. Each provider remains `Not configured` until Kairo can verify its runtime availability.</p>
      </div>
    </SettingsShell>
  );
}

function ProviderGroup({ title, description, kinds }: { title: string; description: string; kinds: MediaProviderKind[] }) {
  return (
    <section className="settings-section" aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-title`}>
      <header>
        <h2 id={`${title.toLowerCase().replaceAll(" ", "-")}-title`}>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="settings-section-body">
        {kinds.map((kind) => {
          const provider = MEDIA_PROVIDERS[kind];
          return (
            <div className="settings-utility-row" key={kind}>
              <div>
                <strong>{provider.title}</strong>
                <p>{provider.model} · {provider.provider}</p>
              </div>
              <div className="settings-row-meta">
                <span className="settings-status default">Default</span>
                <span className="settings-status attention">Not configured</span>
                <Link className="settings-manage-link" href={`/settings/media-providers/${kind}`}>Manage →</Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
