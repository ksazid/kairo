"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  Globe2,
  Instagram,
  Linkedin,
  Lightbulb,
  ListChecks,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
  Youtube,
} from "lucide-react";
import {
  reviewCount,
  updateBrandField,
  updateDiscoveryTopic,
  type BrandBrainField,
  type DiscoveryTopic,
} from "../../lib/brand-brain";

type TabId = "overview" | "dna" | "discovery" | "sources" | "learning";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "dna", label: "Brand DNA" },
  { id: "discovery", label: "Discovery Intelligence" },
  { id: "sources", label: "Sources" },
  { id: "learning", label: "Learning" },
];

const initialFields: BrandBrainField[] = [
  { key: "category", label: "Category", description: "What your Brand does", value: "Technology and business education", state: "confirmed", evidence: ["Website", "LinkedIn"] },
  { key: "offerings", label: "Products & services", description: "What you provide", value: "AI product strategy, software architecture, and practical business guidance", state: "confirmed", evidence: ["Website", "Owner note"] },
  { key: "audience", label: "Primary audience", description: "Who you serve", value: "Malta-based founders and independent professionals", state: "review", evidence: ["Website", "Instagram"] },
  { key: "positioning", label: "Positioning", description: "Why you are meaningfully different", value: "Practical technology guidance grounded in real product delivery", state: "confirmed", evidence: ["Website", "LinkedIn", "Owner note"] },
  { key: "voice", label: "Voice", description: "How your Brand communicates", value: "Clear, direct, useful, and technically credible", state: "confirmed", evidence: ["Instagram", "LinkedIn"] },
  { key: "content", label: "Content focus", description: "What you should talk about", value: "AI products, software architecture, Malta business, and founder growth", state: "suggested", evidence: ["Website", "Instagram", "Performance"] },
  { key: "goals", label: "Primary objective", description: "What content should accomplish", value: "Build authority and generate qualified product conversations", state: "confirmed", evidence: ["Owner note"] },
  { key: "boundaries", label: "Boundaries", description: "Topics and claims Kairo must avoid", value: "Unsupported financial claims, political persuasion, and fabricated personal experience", state: "confirmed", evidence: ["Owner note"] },
];

const initialTopics: DiscoveryTopic[] = [
  { id: "malta-tech", name: "Malta business & technology", priority: "High", audience: "Founders and SMBs", entities: ["Malta startups", "iGaming innovation", "Malta fintech", "technology funding"], sources: ["Industry news", "LinkedIn", "Official sources", "YouTube"] },
  { id: "small-business-ai", name: "AI for small businesses", priority: "High", audience: "SMBs and operators", entities: ["AI tools for SMBs", "productivity AI", "small business automation"], sources: ["Industry news", "YouTube", "LinkedIn"] },
  { id: "personal-brand", name: "Personal brand growth", priority: "Medium", audience: "Founders and creators", entities: ["Founder storytelling", "LinkedIn authority", "thought leadership"], sources: ["LinkedIn", "YouTube", "Industry news"] },
];

const sources = [
  { id: "website", title: "sazzid.com", type: "Website", Icon: Globe2, status: "Healthy", detail: "12 Brand DNA fields supported", synced: "18 minutes ago" },
  { id: "instagram", title: "@sazzid", type: "Instagram", Icon: Instagram, status: "Healthy", detail: "Voice, visual patterns, and audience signals", synced: "42 minutes ago" },
  { id: "linkedin", title: "Sazid Khan", type: "LinkedIn", Icon: Linkedin, status: "Healthy", detail: "Positioning, authority topics, and terminology", synced: "2 hours ago" },
  { id: "notes", title: "Owner positioning notes", type: "Private note", Icon: FileText, status: "Active", detail: "Objectives, boundaries, and approved claims", synced: "Aug 29, 2026" },
];

const learnings = [
  { id: "practical", title: "Practical Malta guides earn more saves", detail: "Useful local recommendations outperform broad commentary when the next action is clear.", evidence: "8 published posts · High confidence", effect: "Increase practical local topics in daily discovery" },
  { id: "technical", title: "Technical breakdowns generate qualified replies", detail: "Architecture and AI implementation posts attract fewer but more relevant conversations.", evidence: "5 published posts · Medium confidence", effect: "Keep technical explainers in the weekly topic mix" },
  { id: "short", title: "Short hooks improve carousel completion", detail: "Direct problem-first openings retain attention better than context-heavy introductions.", evidence: "4 carousels · Medium confidence", effect: "Prefer concise hooks when ranking content angles" },
];

export function BrandBrainClient({ brandId }: { brandId?: string }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [fields, setFields] = useState(initialFields);
  const [topics, setTopics] = useState(initialTopics);
  const [editingField, setEditingField] = useState<string | null>("audience");
  const [fieldDraft, setFieldDraft] = useState(initialFields.find((field) => field.key === "audience")?.value ?? "");
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [topicDraft, setTopicDraft] = useState({ name: "", entities: "" });
  const [refreshState, setRefreshState] = useState<"idle" | "complete">("idle");
  const [notice, setNotice] = useState("2 Brand suggestions need confirmation.");
  const pending = reviewCount(fields);

  function chooseTab(tab: TabId) {
    setActiveTab(tab);
    setNotice(`${tabs.find((item) => item.id === tab)?.label ?? "Brand Brain"} opened.`);
  }

  function startFieldEdit(field: BrandBrainField) {
    setEditingField(field.key);
    setFieldDraft(field.value);
  }

  function saveField(field: BrandBrainField) {
    if (!fieldDraft.trim()) {
      setNotice(`${field.label} cannot be empty.`);
      return;
    }
    setFields((current) => updateBrandField(current, field.key, fieldDraft));
    setEditingField(null);
    setNotice(`${field.label} confirmed and saved in this preview.`);
  }

  function startTopicEdit(topic: DiscoveryTopic) {
    setEditingTopic(topic.id);
    setTopicDraft({ name: topic.name, entities: topic.entities.join(", ") });
  }

  function saveTopic(topic: DiscoveryTopic) {
    if (!topicDraft.name.trim() || !topicDraft.entities.trim()) {
      setNotice("Keep a topic name and at least one search entity.");
      return;
    }
    setTopics((current) => updateDiscoveryTopic(current, topic.id, topicDraft));
    setEditingTopic(null);
    setNotice(`${topic.name} search plan updated in this preview.`);
  }

  function refreshDiscovery() {
    setRefreshState("complete");
    setNotice("Discovery refreshed: 12 valuable opportunities found and 38 weak signals filtered.");
  }

  function reviewSuggestions() {
    setActiveTab("dna");
    const next = fields.find((field) => field.state !== "confirmed");
    if (next) startFieldEdit(next);
  }

  return <section id="brand-brain" className="brand-brain" aria-labelledby="brand-brain-title">
    <header className="brand-brain-header">
      <div>
        <span><Brain aria-hidden="true"/>Brand intelligence</span>
        <h1 id="brand-brain-title">Brand Brain</h1>
        <p>What Kairo knows, what Discovery Intelligence uses, and what needs your confirmation.</p>
      </div>
      <div className="brand-brain-header-actions">
        <button className="brand-secondary-button" type="button" onClick={reviewSuggestions}>
          <ListChecks aria-hidden="true"/>Review {pending} suggestion{pending === 1 ? "" : "s"}
        </button>
        <button className="brand-primary-button" type="button" onClick={refreshDiscovery}>
          {refreshState === "complete" ? <Check aria-hidden="true"/> : <Play aria-hidden="true" fill="currentColor"/>}
          {refreshState === "complete" ? "Discovery refreshed" : "Refresh Discovery"}
        </button>
      </div>
    </header>

    <div className="brand-tab-list" role="tablist" aria-label="Brand Brain sections">
      {tabs.map((tab) => <button
        key={tab.id}
        id={`brand-tab-${tab.id}`}
        type="button"
        role="tab"
        aria-selected={activeTab === tab.id}
        aria-controls={`brand-panel-${tab.id}`}
        onClick={() => chooseTab(tab.id)}
      >{tab.label}{tab.id === "dna" && pending ? <span>{pending}</span> : null}</button>)}
    </div>

    <p className="brand-sr-status" role="status" aria-live="polite">{notice}</p>

    {activeTab === "overview" ? <OverviewPanel fields={fields} editingField={editingField} fieldDraft={fieldDraft} setFieldDraft={setFieldDraft} startFieldEdit={startFieldEdit} saveField={saveField} cancelEdit={() => setEditingField(null)} reviewSuggestions={reviewSuggestions} brandId={brandId}/> : null}
    {activeTab === "dna" ? <DnaPanel fields={fields} editingField={editingField} fieldDraft={fieldDraft} setFieldDraft={setFieldDraft} startFieldEdit={startFieldEdit} saveField={saveField} cancelEdit={() => setEditingField(null)}/> : null}
    {activeTab === "discovery" ? <DiscoveryPanel topics={topics} editingTopic={editingTopic} topicDraft={topicDraft} setTopicDraft={setTopicDraft} startTopicEdit={startTopicEdit} saveTopic={saveTopic} cancelEdit={() => setEditingTopic(null)} onNotice={setNotice} brandId={brandId}/> : null}
    {activeTab === "sources" ? <SourcesPanel/> : null}
    {activeTab === "learning" ? <LearningPanel brandId={brandId}/> : null}
  </section>;
}

function OverviewPanel({ fields, editingField, fieldDraft, setFieldDraft, startFieldEdit, saveField, cancelEdit, reviewSuggestions, brandId }: {
  fields: BrandBrainField[];
  editingField: string | null;
  fieldDraft: string;
  setFieldDraft: (value: string) => void;
  startFieldEdit: (field: BrandBrainField) => void;
  saveField: (field: BrandBrainField) => void;
  cancelEdit: () => void;
  reviewSuggestions: () => void;
  brandId?: string;
}) {
  const audience = fields.find((field) => field.key === "audience")!;
  const content = fields.find((field) => field.key === "content")!;
  const readiness = [
    ["Business", true, BriefcaseBusiness],
    ["Offerings", true, Sparkles],
    ["Audience", audience.state === "confirmed", UsersRound],
    ["Positioning", true, Target],
    ["Topics", true, Lightbulb],
    ["Boundaries", true, ShieldCheck],
  ] as const;

  return <div id="brand-panel-overview" role="tabpanel" aria-labelledby="brand-tab-overview" className="brand-overview-panel">
    <div className="brand-readiness-card">
      <header>
        <div><span><SearchCheck aria-hidden="true"/>Discovery readiness</span><h2>Ready for tomorrow&apos;s discovery run</h2></div>
        <span className="brand-ready-pill"><CheckCircle2 aria-hidden="true"/>Ready</span>
      </header>
      <div className="brand-score-row">
        <div className="brand-score"><strong>84%</strong><span>Brand Intelligence</span></div>
        <div className="brand-score-bars">
          <ScoreBar label="Evidence coverage" value={78}/>
          <ScoreBar label="Confirmed" value={86}/>
          <div className="brand-run-times"><span><Clock3 aria-hidden="true"/><small>Last run</small><strong>Aug 31, 8:00 AM</strong></span><span><CalendarClock aria-hidden="true"/><small>Next run</small><strong>Sep 1, 8:00 AM</strong></span></div>
        </div>
      </div>
      <div className="brand-readiness-list" aria-label="Discovery readiness checklist">
        {readiness.map(([label, ready, Icon]) => <div key={label}><span><Icon aria-hidden="true"/>{label}</span><strong className={ready ? "is-ready" : "needs-review"}>{ready ? <Check aria-hidden="true"/> : <CircleAlert aria-hidden="true"/>}{ready ? "Ready" : "Needs confirmation"}</strong></div>)}
      </div>
    </div>

    <div className="brand-review-card">
      <header><div><span><ListChecks aria-hidden="true"/>Human review</span><h2>Needs your confirmation</h2><p>Confirm only the details that materially improve discovery.</p></div><b>{reviewCount(fields)}</b></header>
      <FieldReviewRow field={audience} expanded={editingField === audience.key} draft={fieldDraft} setDraft={setFieldDraft} onEdit={() => startFieldEdit(audience)} onSave={() => saveField(audience)} onCancel={cancelEdit}/>
      <FieldReviewRow field={content} expanded={editingField === content.key} draft={editingField === content.key ? fieldDraft : content.value} setDraft={setFieldDraft} onEdit={() => startFieldEdit(content)} onSave={() => saveField(content)} onCancel={cancelEdit}/>
      {reviewCount(fields) === 0 ? <div className="brand-review-complete"><CheckCircle2 aria-hidden="true"/><span><strong>Everything important is confirmed.</strong><small>Discovery Intelligence can use this Brand context.</small></span></div> : null}
      <button className="brand-text-button" type="button" onClick={reviewSuggestions}>Review all Brand DNA <ArrowRight aria-hidden="true"/></button>
    </div>

    <div className="brand-daily-strip">
      <div><span><TrendingUp aria-hidden="true"/></span><p><strong>Today&apos;s discovery result</strong><small>Aug 31, 2026 · Completed at 8:04 AM</small></p></div>
      <dl><div><dt>Valuable discoveries</dt><dd>12</dd></div><div><dt>New topic clusters</dt><dd>4</dd></div><div><dt>Weak signals filtered</dt><dd>38</dd></div></dl>
      <Link href={`/discover${brandId ? `?brand=${encodeURIComponent(brandId)}` : ""}`}>View Discover <ChevronRight aria-hidden="true"/></Link>
    </div>
  </div>;
}

function DnaPanel({ fields, editingField, fieldDraft, setFieldDraft, startFieldEdit, saveField, cancelEdit }: {
  fields: BrandBrainField[];
  editingField: string | null;
  fieldDraft: string;
  setFieldDraft: (value: string) => void;
  startFieldEdit: (field: BrandBrainField) => void;
  saveField: (field: BrandBrainField) => void;
  cancelEdit: () => void;
}) {
  return <div id="brand-panel-dna" role="tabpanel" aria-labelledby="brand-tab-dna" className="brand-section-panel">
    <header className="brand-section-header"><div><span><Brain aria-hidden="true"/>Editable Brand model</span><h2>Brand DNA</h2><p>Click any value to correct or confirm what Kairo uses for recommendations and creation.</p></div><div className="brand-legend"><span><i className="confirmed"/>Confirmed</span><span><i className="suggested"/>AI suggested</span><span><i className="review"/>Needs review</span></div></header>
    <div className="brand-field-table" role="list">
      <div className="brand-field-head" aria-hidden="true"><span>Brand context</span><span>Source / evidence</span><span>Status</span><span>Edit</span></div>
      {fields.map((field) => <BrandFieldRow key={field.key} field={field} editing={editingField === field.key} draft={editingField === field.key ? fieldDraft : field.value} setDraft={setFieldDraft} onEdit={() => startFieldEdit(field)} onSave={() => saveField(field)} onCancel={cancelEdit}/>)}
    </div>
  </div>;
}

function DiscoveryPanel({ topics, editingTopic, topicDraft, setTopicDraft, startTopicEdit, saveTopic, cancelEdit, onNotice, brandId }: {
  topics: DiscoveryTopic[];
  editingTopic: string | null;
  topicDraft: { name: string; entities: string };
  setTopicDraft: (value: { name: string; entities: string }) => void;
  startTopicEdit: (topic: DiscoveryTopic) => void;
  saveTopic: (topic: DiscoveryTopic) => void;
  cancelEdit: () => void;
  onNotice: (message: string) => void;
  brandId?: string;
}) {
  return <div id="brand-panel-discovery" role="tabpanel" aria-labelledby="brand-tab-discovery" className="brand-discovery-panel">
    <section className="brand-search-plan">
      <header><div><span><SearchCheck aria-hidden="true"/>Discovery plan</span><h2>What Kairo will search on the next run</h2><p>Review the topics, audiences, entities, and sources used by the discovery engine.</p></div><div><span><CalendarClock aria-hidden="true"/><small>Automatic schedule</small><strong>Not enabled</strong></span></div></header>
      <div className="brand-topic-list">
        {topics.map((topic, index) => <TopicRow key={topic.id} topic={topic} index={index + 1} editing={editingTopic === topic.id} draft={topicDraft} setDraft={setTopicDraft} onEdit={() => startTopicEdit(topic)} onSave={() => saveTopic(topic)} onCancel={cancelEdit}/>)}
      </div>
      <footer><ShieldCheck aria-hidden="true"/><span><strong>Excluded topics</strong><small>Cryptocurrency speculation, political persuasion, adult content, and unsupported financial claims.</small></span></footer>
    </section>
    <aside className="brand-discovery-rail">
      <section className="brand-hunter-schedule">
        <header><span><CalendarClock aria-hidden="true"/>Hunter schedule</span><button type="button" disabled title="Automatic Hunter scheduling does not have an approved runtime contract."><Pencil aria-hidden="true"/>Unavailable</button></header>
        <dl><div><dt>Frequency</dt><dd>Not scheduled</dd></div><div><dt>Run time</dt><dd>—</dd></div><div><dt>Timezone</dt><dd>—</dd></div><div><dt>Depth</dt><dd>Per manual run</dd></div></dl>
        <p>Automatic background scheduling is not enabled in this release.</p>
        <button className="brand-schedule-toggle" type="button" disabled onClick={() => onNotice("Automatic Hunter scheduling is not enabled.")}>Scheduling unavailable</button>
      </section>
      <section><span><Brain aria-hidden="true"/>Brand Intelligence</span><ScoreBar label="Overall intelligence" value={84}/><ScoreBar label="Evidence coverage" value={78}/><ScoreBar label="Confirmed" value={86}/></section>
      <section className="brand-discovery-status"><span><SearchCheck aria-hidden="true"/>Discovery status</span><strong>Ready</strong><p>Your search plan has enough confirmed Brand context.</p></section>
      <section><span><TrendingUp aria-hidden="true"/>Previous run</span><dl><div><dt>Valuable discoveries</dt><dd>12</dd></div><div><dt>Weak signals filtered</dt><dd>38</dd></div></dl><Link href={`/discover${brandId ? `?brand=${encodeURIComponent(brandId)}` : ""}`}>View today&apos;s discoveries <ArrowRight aria-hidden="true"/></Link></section>
    </aside>
  </div>;
}

function SourcesPanel() {
  return <div id="brand-panel-sources" role="tabpanel" aria-labelledby="brand-tab-sources" className="brand-section-panel">
    <header className="brand-section-header"><div><span><Globe2 aria-hidden="true"/>Evidence coverage</span><h2>Sources</h2><p>Manage where Kairo learns this Brand. Publishing destinations remain separate.</p></div><button className="brand-primary-button" type="button"><Plus aria-hidden="true"/>Add source</button></header>
    <div className="brand-source-summary"><div><strong>4</strong><span>Active sources</span></div><div><strong>78%</strong><span>Evidence coverage</span></div><div><strong>18m</strong><span>Most recent sync</span></div></div>
    <div className="brand-source-list">
      {sources.map(({ id, title, type, Icon, status, detail, synced }) => <article key={id}>
        <span className="brand-source-icon"><Icon aria-hidden="true"/></span>
        <div><small>{type}</small><strong>{title}</strong><p>{detail}</p></div>
        <span className="brand-source-sync"><small>Last updated</small><strong>{synced}</strong></span>
        <span className="brand-source-health"><CheckCircle2 aria-hidden="true"/>{status}</span>
        <div className="brand-source-actions"><button type="button"><RefreshCw aria-hidden="true"/>Refresh</button><button type="button">Manage</button></div>
      </article>)}
    </div>
    <p className="brand-source-note"><ShieldCheck aria-hidden="true"/>Private notes stay inside this Brand. Credentials and provider details are never exposed here.</p>
  </div>;
}

function LearningPanel({ brandId }: { brandId?: string }) {
  return <div id="brand-panel-learning" role="tabpanel" aria-labelledby="brand-tab-learning" className="brand-section-panel">
    <header className="brand-section-header"><div><span><BookOpenCheck aria-hidden="true"/>Performance memory</span><h2>Learning</h2><p>Only accepted, evidence-backed learnings influence future discovery and recommendations.</p></div><Link className="brand-secondary-button" href={`/insights${brandId ? `?brand=${encodeURIComponent(brandId)}` : ""}`}>Open Insights <ArrowRight aria-hidden="true"/></Link></header>
    <div className="brand-learning-guardrail"><ShieldCheck aria-hidden="true"/><span><strong>Your confirmed Brand DNA stays authoritative.</strong><small>Performance learning may adjust ranking and recommendations, but it never silently overwrites confirmed Brand facts.</small></span></div>
    <div className="brand-learning-list">
      {learnings.map((learning) => <article key={learning.id}>
        <span><Lightbulb aria-hidden="true"/></span>
        <div><strong>{learning.title}</strong><p>{learning.detail}</p><small>{learning.evidence}</small></div>
        <div><small>How Kairo uses this</small><strong>{learning.effect}</strong></div>
        <span className="brand-learning-accepted"><Check aria-hidden="true"/>Accepted</span>
        <button type="button" aria-label={`Remove ${learning.title}`}><Trash2 aria-hidden="true"/></button>
      </article>)}
    </div>
  </div>;
}

function FieldReviewRow({ field, expanded, draft, setDraft, onEdit, onSave, onCancel }: {
  field: BrandBrainField;
  expanded: boolean;
  draft: string;
  setDraft: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return <section className={`brand-review-row ${expanded ? "is-expanded" : ""}`}>
    <header><span><UserRound aria-hidden="true"/><span><strong>{field.label}</strong><small>{field.description}</small></span></span><StateLabel state={field.state}/>{expanded ? <ChevronDown aria-hidden="true"/> : <button type="button" onClick={onEdit} aria-label={`Edit ${field.label}`}><ChevronRight aria-hidden="true"/></button>}</header>
    {expanded ? <div className="brand-inline-editor"><label htmlFor={`overview-${field.key}`}>{field.description}</label><textarea id={`overview-${field.key}`} value={draft} onChange={(event) => setDraft(event.target.value)} rows={3}/><div className="brand-evidence"><small>Evidence</small><span>{field.evidence.map((item) => <i key={item}>{item}</i>)}</span><p>Based on {field.evidence.length + 3} readable sources · Moderate confidence</p></div><div className="brand-editor-actions"><button type="button" onClick={onSave}>Save</button><button type="button" onClick={onCancel}>Cancel</button></div></div> : <p>{field.value}</p>}
  </section>;
}

function BrandFieldRow({ field, editing, draft, setDraft, onEdit, onSave, onCancel }: {
  field: BrandBrainField;
  editing: boolean;
  draft: string;
  setDraft: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return <div className={`brand-field-row ${editing ? "is-editing" : ""}`} role="listitem">
    <div className="brand-field-value"><span><strong>{field.label}</strong><small>{field.description}</small></span>{editing ? <textarea aria-label={`Edit ${field.label}`} value={draft} onChange={(event) => setDraft(event.target.value)} rows={2}/> : <p>{field.value}</p>}</div>
    <div className="brand-field-evidence">{field.evidence.map((item) => <span key={item}>{item}</span>)}</div>
    <StateLabel state={field.state}/>
    <div className="brand-field-actions">{editing ? <><button className="save" type="button" onClick={onSave}><Check aria-hidden="true"/>Save</button><button type="button" onClick={onCancel}><X aria-hidden="true"/>Cancel</button></> : <button type="button" onClick={onEdit} aria-label={`Edit ${field.label}`}><Pencil aria-hidden="true"/></button>}</div>
  </div>;
}

function TopicRow({ topic, index, editing, draft, setDraft, onEdit, onSave, onCancel }: {
  topic: DiscoveryTopic;
  index: number;
  editing: boolean;
  draft: { name: string; entities: string };
  setDraft: (value: { name: string; entities: string }) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return <article className={editing ? "is-editing" : ""}>
    <span className="brand-topic-number">{index}</span>
    <div className="brand-topic-main"><small>Topic</small>{editing ? <input aria-label={`Edit ${topic.name} topic`} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })}/> : <strong>{topic.name}</strong>}</div>
    <div><small>Priority</small><strong className={`brand-priority ${topic.priority.toLowerCase()}`}><i/>{topic.priority}</strong></div>
    <div><small>Target audience</small><strong>{topic.audience}</strong></div>
    <button className="brand-topic-edit" type="button" onClick={editing ? onCancel : onEdit} aria-label={editing ? `Cancel editing ${topic.name}` : `Edit ${topic.name}`}><Pencil aria-hidden="true"/></button>
    <div className="brand-topic-details"><small>Key search entities</small>{editing ? <input aria-label="Search entities separated by commas" value={draft.entities} onChange={(event) => setDraft({ ...draft, entities: event.target.value })}/> : <span>{topic.entities.map((entity) => <i key={entity}>{entity}</i>)}</span>}<small>Likely sources</small><span>{topic.sources.map((source) => <i key={source}>{source}</i>)}</span></div>
    {editing ? <div className="brand-topic-actions"><button type="button" onClick={onSave}>Save</button><button type="button" onClick={onCancel}>Cancel</button></div> : null}
  </article>;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return <div className="brand-score-bar"><span><small>{label}</small><strong>{value}%</strong></span><progress value={value} max={100} aria-label={`${label} ${value}%`}/></div>;
}

function StateLabel({ state }: { state: BrandBrainField["state"] }) {
  const label = state === "confirmed" ? "Confirmed" : state === "suggested" ? "AI suggested" : "Needs review";
  return <span className={`brand-field-state ${state}`}><i/>{label}</span>;
}
