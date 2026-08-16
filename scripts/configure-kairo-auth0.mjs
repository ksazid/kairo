const APPLY = process.argv.includes("--apply");
const PLAN = process.argv.includes("--plan") || !APPLY;

function env(name, { required = true, fallback } = {}) {
  const value = process.env[name]?.trim() || fallback;
  if (required && !value) throw new Error(`${name} is required`);
  return value;
}

function normalizeDomain(value) {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function normalizeOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("KAIRO_WEB_ORIGIN must use HTTPS");
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("KAIRO_WEB_ORIGIN must be an origin only, with no path/query/hash");
  }
  return url.origin;
}

const domain = normalizeDomain(env("AUTH0_DOMAIN"));
const webOrigin = normalizeOrigin(env("KAIRO_WEB_ORIGIN"));
const audience = env("KAIRO_API_AUDIENCE", { required: false, fallback: "urn:kairo:api" });
const managementToken = env("AUTH0_MGMT_TOKEN", { required: APPLY });
const logoUrl = `${webOrigin}/kairo-auth-logo.svg`;
const callbackUrl = `${webOrigin}/auth/callback`;
const issuer = `https://${domain}/`;
const jwksUri = `https://${domain}/.well-known/jwks.json`;

const desired = {
  application: {
    name: "Kairo Web",
    app_type: "regular_web",
    callbacks: [callbackUrl],
    allowed_logout_urls: [webOrigin],
    web_origins: [webOrigin],
    logo_uri: logoUrl,
    oidc_conformant: true,
  },
  api: {
    name: "Kairo API",
    identifier: audience,
    signing_alg: "RS256",
  },
  databaseConnection: {
    preferredName: "kairo-db",
    strategy: "auth0",
    displayName: "Email",
  },
  branding: {
    logo_url: logoUrl,
    colors: {
      primary: "#4F46E5",
      page_background: "#F8FAFC",
    },
  },
};

function printPlan() {
  console.log(JSON.stringify({
    mode: APPLY ? "apply" : "plan",
    tenant: domain,
    webOrigin,
    callbackUrl,
    logoutUrl: webOrigin,
    audience,
    issuer,
    jwksUri,
    logoUrl,
    desired,
    externalFollowUp: [
      "Configure Google social connection with Kairo-owned Google OAuth credentials and enable it for Kairo Web.",
      "Configure Apple later when Apple Developer credentials are available.",
      "Set OIDC_CLIENT_SECRET in the deployment platform secret store; never commit it.",
      "Redeploy Web/API and run real login -> callback -> onboarding/app -> logout smoke tests.",
    ],
  }, null, 2));
}

if (PLAN && !APPLY) {
  printPlan();
  process.exit(0);
}

async function auth0(path, { method = "GET", body, allow404 = false } = {}) {
  const response = await fetch(`https://${domain}/api/v2${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${managementToken}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (allow404 && response.status === 404) return null;
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${method} ${path} failed (${response.status}): ${text.slice(0, 1200)}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function items(value, key) {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.[key]) ? value[key] : [];
}

async function ensureApplication() {
  const response = await auth0("/clients?per_page=100&include_totals=true");
  let client = items(response, "clients").find((item) => item.name === desired.application.name);

  if (!client) {
    client = await auth0("/clients", { method: "POST", body: desired.application });
    console.log(`created Auth0 application: ${client.client_id}`);
  } else {
    client = await auth0(`/clients/${encodeURIComponent(client.client_id)}`, {
      method: "PATCH",
      body: desired.application,
    });
    console.log(`updated Auth0 application: ${client.client_id}`);
  }

  return client;
}

async function ensureApi() {
  const response = await auth0("/resource-servers?per_page=100&include_totals=true");
  let api = items(response, "resource_servers").find((item) => item.identifier === audience);
  if (!api) {
    api = await auth0("/resource-servers", { method: "POST", body: desired.api });
    console.log(`created Auth0 API: ${api.id}`);
  } else {
    api = await auth0(`/resource-servers/${encodeURIComponent(api.id)}`, {
      method: "PATCH",
      body: { name: desired.api.name, signing_alg: "RS256" },
    });
    console.log(`updated Auth0 API: ${api.id}`);
  }
  return api;
}

async function ensureDatabaseConnection(clientId) {
  const response = await auth0("/connections?strategy=auth0&per_page=100");
  let connection = items(response, "connections").find((item) => item.name === "Username-Password-Authentication")
    || items(response, "connections").find((item) => item.name === desired.databaseConnection.preferredName)
    || items(response, "connections")[0];

  if (!connection) {
    connection = await auth0("/connections", {
      method: "POST",
      body: {
        name: desired.databaseConnection.preferredName,
        display_name: desired.databaseConnection.displayName,
        strategy: "auth0",
      },
    });
    console.log(`created database connection: ${connection.id}`);
  }

  await auth0(`/connections/${encodeURIComponent(connection.id)}/clients`, {
    method: "PATCH",
    body: [{ client_id: clientId, status: true }],
  });
  console.log(`enabled database connection for Kairo Web: ${connection.id}`);
  return connection;
}

async function ensureBranding() {
  await auth0("/branding", { method: "PATCH", body: desired.branding });
  console.log("updated Kairo basic Universal Login branding");

  const theme = await auth0("/branding/themes/default", { allow404: true });
  if (!theme?.themeId) {
    console.log("no materialized default theme yet; basic branding is applied. Open Branding > Universal Login once and Save/Publish to materialize the theme, then rerun this script for detailed styling.");
    return;
  }

  const body = {
    displayName: "Kairo",
    borders: {
      ...theme.borders,
      button_border_radius: 8,
      button_border_weight: 1,
      input_border_radius: 8,
      input_border_weight: 1,
      show_widget_shadow: false,
      widget_border_weight: 1,
      widget_corner_radius: 12,
    },
    colors: {
      ...theme.colors,
      body_text: "#111827",
      header: "#111827",
      icons: "#6B7280",
      input_background: "#FFFFFF",
      input_border: "#D1D5DB",
      input_filled_text: "#111827",
      input_labels_placeholders: "#6B7280",
      links_focused_components: "#4F46E5",
      primary_button: "#4F46E5",
      primary_button_label: "#FFFFFF",
      secondary_button_border: "#D1D5DB",
      secondary_button_label: "#111827",
      widget_background: "#FFFFFF",
      widget_border: "#E5E7EB",
      base_focus_color: "#4F46E5",
      base_hover_color: "#4338CA",
    },
    fonts: theme.fonts,
    page_background: {
      ...theme.page_background,
      background_color: "#F8FAFC",
      page_layout: "center",
    },
    widget: {
      ...theme.widget,
      header_text_alignment: "center",
      logo_height: 40,
      logo_position: "center",
      logo_url: logoUrl,
      social_buttons_layout: "bottom",
    },
  };

  await auth0(`/branding/themes/${encodeURIComponent(theme.themeId)}`, {
    method: "PATCH",
    body,
  });
  console.log(`updated Kairo Universal Login theme: ${theme.themeId}`);
}

async function main() {
  const client = await ensureApplication();
  await ensureApi();
  await ensureDatabaseConnection(client.client_id);
  await ensureBranding();

  console.log("\nKairo Auth0 tenant configuration applied.");
  console.log("Set these deployment values (secret value omitted):");
  console.log(`OIDC_ISSUER=${issuer}`);
  console.log(`OIDC_CLIENT_ID=${client.client_id}`);
  console.log("OIDC_CLIENT_SECRET=<retrieve/store securely from Kairo Web application>");
  console.log(`OIDC_AUDIENCE=${audience}`);
  console.log(`OIDC_JWKS_URI=${jwksUri}`);
  console.log(`KAIRO_AUTH_CALLBACK=${callbackUrl}`);
  console.log("\nGoogle and Apple are intentionally not auto-configured because provider credentials are external secrets.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
