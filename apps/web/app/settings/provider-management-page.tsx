import type { MediaProviderDefinition } from "./provider-catalog";
import { SettingsShell } from "./settings-shell";

export async function ProviderManagementPage({ definition }: { definition: MediaProviderDefinition }) {
  return (
    <SettingsShell
      active="media-providers"
      title={definition.title}
      description={`Configure the default ${definition.title.toLowerCase()} provider Kairo should use.`}
      breadcrumb={["Media Providers", definition.title]}
    >
      <section className="settings-provider-hero" aria-label={`${definition.title} provider`}>
        <div>
          <h2>{definition.model}</h2>
          <p>{definition.provider} · {definition.role}</p>
        </div>
        <div className="settings-provider-badges">
          <span className="settings-status attention">Not configured</span>
          {definition.badges.map((badge) => <span className="settings-status" key={badge}>{badge}</span>)}
        </div>
      </section>

      <div className="settings-inline-note" role="status">
        <strong>Provider connection is not configured yet.</strong>
        <p>The approved settings are shown below, but Kairo will not claim this provider is ready until runtime configuration and validation are connected.</p>
      </div>

      <section className="settings-section" aria-labelledby={`${definition.kind}-configuration-title`}>
        <header>
          <h2 id={`${definition.kind}-configuration-title`}>Configuration</h2>
          <p>Default settings approved for this provider.</p>
        </header>
        <div>
          <form className="settings-provider-form">
            {definition.fields.map((field) => (
              <div className="settings-form-row" key={field.label}>
                <div>
                  <label>{field.label}</label>
                  {field.hint ? <small>{field.hint}</small> : null}
                </div>
                {field.type === "toggle" ? (
                  <label className="settings-toggle">
                    <input type="checkbox" checked={field.value === "On"} disabled readOnly />
                    <span>{field.value}</span>
                  </label>
                ) : (
                  <select aria-label={field.label} value={field.value} disabled readOnly>
                    {(field.options ?? [field.value]).map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                )}
              </div>
            ))}
            <div className="settings-form-actions">
              <button className="secondary-button" type="button" disabled title="Provider configuration persistence is not connected yet">Save Changes</button>
            </div>
          </form>
        </div>
      </section>
    </SettingsShell>
  );
}
