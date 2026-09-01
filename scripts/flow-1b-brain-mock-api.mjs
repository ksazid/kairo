import http from "node:http";

const now = "2026-09-01T01:00:00.000Z";
const fields = [
  field("identity.description", "A rider-first motorcycle creator Brand focused on practical KTM Duke ownership in Malta.", "identity", "inferred", ["source-instagram"]),
  field("identity.category", "Motorcycle creator and rider education", "identity", "inferred", ["source-instagram"]),
  field("identity.geography", "Malta", "identity", "confirmed", []),
  field("identity.products-services", "Ownership guidance, riding content, motorcycle modifications", "identity", "inferred", ["source-instagram", "source-web"]),
  field("audience.primary", "KTM Duke riders and practical motorcycle enthusiasts", "audience", "confirmed", []),
  field("audience.pains", "Choosing useful modifications, maintenance decisions, and everyday ownership trade-offs", "audience", "inferred", ["source-instagram"]),
  field("positioning.value-proposition", "Practical rider-tested advice instead of generic motorcycle commentary", "positioning", "inferred", ["source-web"]),
  field("positioning.differentiation", "Real ownership experience and Malta riding context", "positioning", "inferred", ["source-instagram"]),
  field("voice.tone", "Direct, practical, rider-to-rider", "voice", "inferred", ["source-instagram"]),
  field("content.pillars", "Duke ownership, modifications, riding tips, Malta routes", "content-strategy", "inferred", ["source-instagram"]),
  field("content.preferred-topics", "Maintenance, useful upgrades, rider questions, local rides", "content-strategy", "inferred", ["source-instagram"]),
  field("content.channels", "Instagram, website", "content-strategy", "confirmed", []),
  field("boundaries.excluded-topics", "Unsafe riding advice, unverified mechanical claims", "boundaries", "confirmed", []),
  field("boundaries.claims-to-avoid", "Performance or safety claims without evidence", "boundaries", "inferred", ["source-web"]),
];

const sources = [
  { id: "source-instagram", workspaceId: "workspace-ui", brandId: "brand-ui", type: "url", status: "active", title: "Instagram profile", sourceUrl: "https://www.instagram.com/_dukeman390/", createdAt: now, updatedAt: now },
  { id: "source-web", workspaceId: "workspace-ui", brandId: "brand-ui", type: "url", status: "active", title: "Brand website", sourceUrl: "https://example.com/dukeman", createdAt: now, updatedAt: now },
];

function field(fieldKey, value, section, state, sourceIds) {
  return { id: `field-${fieldKey.replace(/[^a-z0-9]+/gi, "-")}`, workspaceId: "workspace-ui", brandId: "brand-ui", section, fieldKey, value, state, sourceIds, version: 1, updatedAt: now, ...(state === "confirmed" ? { confirmedByAccountId: "account-ui" } : {}) };
}

function activation() {
  const activationFields = fields.map((item) => {
    const origin = item.state === "confirmed" ? "user-confirmed" : item.sourceIds.length ? "source-backed" : "ai-inferred";
    const score = origin === "user-confirmed" ? 1 : origin === "source-backed" ? .85 : .55;
    return { fieldKey: item.fieldKey, origin, confidence: { score, level: score >= .8 ? "high" : "medium" }, sourceIds: item.sourceIds, critical: true, weak: false, updatedAt: item.updatedAt };
  });
  return {
    brain: fields,
    sources,
    status: "ready-for-hunter",
    hunterReady: true,
    readiness: { status: "ready", score: 100, brandIntelligenceScore: 90, evidenceCoverage: 79, confidence: 29, gaps: [], nextAction: "Continue to Content", evaluatedAt: now },
    completeness: { score: 100, knownGroups: 6, totalGroups: 6 },
    fields: activationFields,
    weakFields: [],
    recommendedSources: [],
    evidenceSourceCount: 2,
    updatedAt: now,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:4000");
  const method = req.method ?? "GET";
  res.setHeader("content-type", "application/json; charset=utf-8");

  if (url.pathname === "/health") return send(res, 200, { status: "ok" });
  if (url.pathname === "/api/v1/session") return send(res, 200, { account: { id: "account-ui" }, workspaces: [{ id: "workspace-ui", name: "Studio" }] });
  if (url.pathname === "/api/v1/workspaces/workspace-ui/brands") return send(res, 200, [{ id: "brand-ui", workspaceId: "workspace-ui", name: "The Duke Man", status: "active" }]);

  if (url.pathname.startsWith("/api/v1/brands/brand-ui/")) {
    if (["/opportunities", "/campaigns", "/ideas", "/learnings"].some((suffix) => url.pathname.endsWith(suffix))) return send(res, 200, []);
    if (url.pathname === "/api/v1/brands/brand-ui/brain/activation") return send(res, 200, activation());
    if (method === "PUT" && url.pathname.startsWith("/api/v1/brands/brand-ui/brain/")) {
      const fieldKey = decodeURIComponent(url.pathname.slice("/api/v1/brands/brand-ui/brain/".length));
      const body = await readJson(req);
      const existing = fields.find((item) => item.fieldKey === fieldKey);
      if (existing) {
        existing.value = String(body.value ?? existing.value);
        existing.state = "confirmed";
        existing.sourceIds = [];
        existing.version += 1;
        existing.updatedAt = "2026-09-01T01:05:00.000Z";
        existing.confirmedByAccountId = "account-ui";
      }
      return send(res, 200, existing ?? { fieldKey, value: body.value, version: 1 });
    }
    if (method === "POST" && url.pathname === "/api/v1/brands/brand-ui/sources") return send(res, 201, sources[0]);
    if (method === "POST" && url.pathname === "/api/v1/brands/brand-ui/brain/bootstrap") return send(res, 200, { brain: fields, generatorStatus: "generated", proposedCount: 0, skippedConfirmedCount: 4, sourceIds: sources.map((item) => item.id) });
  }

  send(res, 404, { title: "Not found", status: 404, detail: `${method} ${url.pathname}` });
});

server.listen(4000, "127.0.0.1", () => console.log("Flow 1B fixture API listening on 4000"));

function send(res, status, body) { res.statusCode = status; res.end(JSON.stringify(body)); }
function readJson(req) { return new Promise((resolve) => { let value = ""; req.on("data", (chunk) => { value += chunk; }); req.on("end", () => { try { resolve(value ? JSON.parse(value) : {}); } catch { resolve({}); } }); }); }
