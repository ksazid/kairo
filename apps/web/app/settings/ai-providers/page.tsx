import { AI_PROVIDER } from "../provider-catalog";
import { SettingsShell } from "../settings-shell";

export default async function AiProvidersPage() {
  return (
    <SettingsShell
      active="ai-providers"
      title="AI Providers"
      description="Connect and customize the AI providers Kairo uses for writing, research, and recommendations."
    >
      <section className="settings-section" aria-labelledby="ai-primary-capability-title">
        <header>
          <h2 id="ai-primary-capability-title">Primary Capability</h2>
          <p>The default provider for writing and reasoning across Kairo.</p>
        </header>
        <div className="settings-section-body">
          <div className="settings-utility-row">
            <div>
              <strong>{AI_PROVIDER.role}</strong>
              <p>{AI_PROVIDER.name}</p>
            </div>
            <div className="settings-row-meta">
              <span className="settings-status default">Default</span>
              <span className="settings-status attention">Not configured</span>
              <button className="settings-manage-link" type="button" disabled title="AI provider management is not connected yet">Manage →</button>
            </div>
          </div>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="ai-provider-capabilities-title">
        <header>
          <h2 id="ai-provider-capabilities-title">Available Via Provider</h2>
          <p>Capabilities that use the configured writing and reasoning provider.</p>
        </header>
        <div className="settings-section-body">
          {AI_PROVIDER.capabilities.map((capability) => (
            <div className="settings-utility-row" key={capability}>
              <div>
                <strong>{capability}</strong>
                <p>{AI_PROVIDER.name}</p>
              </div>
              <div className="settings-row-meta">
                <span className="settings-status">{AI_PROVIDER.name}</span>
                <button className="settings-manage-link" type="button" disabled title="AI provider management is not connected yet">Manage →</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="settings-inline-note" role="status">
        <strong>AI provider configuration is not connected yet.</strong>
        <p>The approved Ollama provider UI is available now. Kairo will report readiness only after provider configuration and validation are wired.</p>
      </div>
    </SettingsShell>
  );
}
