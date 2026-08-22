import Link from "next/link";
import {
  getBrand,
  getBrands,
  getCalendar,
  getCampaigns,
  getChannelAccounts,
  type PublishCommandView,
} from "../../../../src/lib/kairo-api";
import {
  addCalendarMonths,
  applyCalendarFilters,
  buildCalendarMonth,
  calendarMonthKey,
  calendarRangeIso,
  parseCalendarMonth,
  type CalendarChannel,
  type CalendarStatus,
} from "../../../../src/lib/calendar-view-model";
import { PilotMobileNav } from "../../../pilot-mobile-nav";
import { KairoSidebar } from "../../../legacy-pilot-navigation";
import { cancelPublishAction, retryPublishAction } from "./actions";

type Params = Promise<{ brandId: string }>;
type Search = Promise<{
  notice?: string;
  error?: string;
  month?: string;
  brand?: string;
  campaign?: string;
  channel?: string;
  status?: string;
}>;

type CalendarEntry = PublishCommandView & { brandName: string; campaignName: string };

type DestinationView = Awaited<ReturnType<typeof getChannelAccounts>>[number] & { brandName: string };

const CHANNELS: CalendarChannel[] = ["instagram", "facebook", "linkedin", "manual"];
const STATUSES: CalendarStatus[] = ["scheduled", "dispatching", "published", "failed", "unknown", "manual-required", "cancelled"];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function CalendarPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { brandId } = await params;
  const [brand, messages] = await Promise.all([getBrand(brandId), searchParams]);
  if (!brand) return null;

  const workspaceBrandsResult = await getBrands(brand.workspaceId);
  const workspaceBrands = workspaceBrandsResult.length ? workspaceBrandsResult : [brand];
  const requestedBrand = messages.brand ?? brand.id;
  const brandFilter = requestedBrand === "all" || workspaceBrands.some((candidate) => candidate.id === requestedBrand)
    ? requestedBrand
    : brand.id;
  const visibleBrands = brandFilter === "all"
    ? workspaceBrands
    : [workspaceBrands.find((candidate) => candidate.id === brandFilter) ?? brand];

  const monthStart = parseCalendarMonth(messages.month);
  const range = calendarRangeIso(monthStart);
  const bundles = await Promise.all(visibleBrands.map(async (visibleBrand) => {
    const [commands, campaigns, accounts] = await Promise.all([
      getCalendar(visibleBrand.id, range.from, range.to),
      getCampaigns(visibleBrand.id),
      getChannelAccounts(visibleBrand.id),
    ]);
    return { brand: visibleBrand, commands, campaigns, accounts };
  }));

  const campaignOptions = bundles.flatMap(({ brand: bundleBrand, campaigns }) =>
    campaigns.map((campaign) => ({ id: campaign.id, name: campaign.name, brandId: bundleBrand.id, brandName: bundleBrand.name })),
  );
  const campaignFilter = messages.campaign && campaignOptions.some((campaign) => campaign.id === messages.campaign)
    ? messages.campaign
    : "all";
  const channelFilter = normaliseChannel(messages.channel);
  const statusFilter = normaliseStatus(messages.status);

  const entries: CalendarEntry[] = bundles.flatMap(({ brand: bundleBrand, campaigns, commands }) => {
    const campaignNames = new Map(campaigns.map((campaign) => [campaign.id, campaign.name]));
    return commands.map((command) => ({
      ...command,
      brandName: bundleBrand.name,
      campaignName: campaignNames.get(command.campaignId) ?? "Campaign",
    }));
  });
  const destinations: DestinationView[] = bundles.flatMap(({ brand: bundleBrand, accounts }) =>
    accounts.map((account) => ({ ...account, brandName: bundleBrand.name })),
  );

  const filtered = applyCalendarFilters(entries, {
    brandId: brandFilter,
    campaignId: campaignFilter,
    channel: channelFilter,
    status: statusFilter,
  }).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  const calendar = buildCalendarMonth(monthStart, filtered);
  const grouped = group(filtered);
  const todayKey = new Date().toISOString().slice(0, 10);
  const activeFilters = brandFilter !== brand.id || campaignFilter !== "all" || channelFilter !== "all" || statusFilter !== "all";
  const navigationState = { brand: brandFilter, campaign: campaignFilter, channel: channelFilter, status: statusFilter };

  return (
    <div className="app-shell">
      <KairoSidebar brandId={brand.id} active="Calendar" />
      <main className="workspace-main calendar-main">
        <header className="topbar calendar-topbar">
          <div>
            <p className="eyebrow">Calendar</p>
            <h1>Plan clearly. Publish truthfully.</h1>
            <p className="lede">See approved content across time, Brands and channels without hiding failed, manual or uncertain publishing outcomes.</p>
          </div>
          <Link className="secondary-button" href={`/brands/${encodeURIComponent(brand.id)}/campaigns`}>Open Content Studio</Link>
        </header>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        <section className="calendar-workspace" aria-labelledby="calendar-title">
          <div className="calendar-toolbar">
            <div className="calendar-range-nav">
              <Link
                className="calendar-icon-button"
                href={calendarHref(brand.id, addCalendarMonths(monthStart, -1), navigationState)}
                aria-label="Previous month"
              >
                <span aria-hidden="true">‹</span>
              </Link>
              <div className="calendar-range-copy">
                <p className="eyebrow">Schedule</p>
                <h2 id="calendar-title">{calendar.label}</h2>
              </div>
              <Link
                className="calendar-icon-button"
                href={calendarHref(brand.id, addCalendarMonths(monthStart, 1), navigationState)}
                aria-label="Next month"
              >
                <span aria-hidden="true">›</span>
              </Link>
              <Link
                className="tertiary-button calendar-today-button"
                href={calendarHref(brand.id, parseCalendarMonth(calendarMonthKey(new Date())), navigationState)}
              >
                Today
              </Link>
            </div>
            <p className="calendar-visible-summary" role="status">
              {filtered.length} visible {filtered.length === 1 ? "item" : "items"}
              {brandFilter === "all" ? ` across ${visibleBrands.length} Brands` : ` for ${visibleBrands[0]?.name ?? brand.name}`}
            </p>
          </div>

          <form className="calendar-filters" method="get" aria-label="Filter calendar">
            <input type="hidden" name="month" value={calendar.monthKey} />
            <label>
              <span>Brand</span>
              <select name="brand" defaultValue={brandFilter}>
                <option value="all">All Brands</option>
                {workspaceBrands.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
              </select>
            </label>
            <label>
              <span>Campaign</span>
              <select name="campaign" defaultValue={campaignFilter}>
                <option value="all">All campaigns</option>
                {campaignOptions.map((campaign) => (
                  <option key={`${campaign.brandId}:${campaign.id}`} value={campaign.id}>
                    {brandFilter === "all" ? `${campaign.brandName} — ` : ""}{campaign.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Channel</span>
              <select name="channel" defaultValue={channelFilter}>
                <option value="all">All channels</option>
                {CHANNELS.map((channel) => <option key={channel} value={channel}>{title(channel)}</option>)}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select name="status" defaultValue={statusFilter}>
                <option value="all">All statuses</option>
                {STATUSES.map((status) => <option key={status} value={status}>{title(status)}</option>)}
              </select>
            </label>
            <div className="calendar-filter-actions">
              <button className="primary-button" type="submit">Apply filters</button>
              {activeFilters ? (
                <Link className="tertiary-button" href={calendarHref(brand.id, monthStart, { brand: brand.id, campaign: "all", channel: "all", status: "all" })}>
                  Clear
                </Link>
              ) : null}
            </div>
          </form>

          {entries.length ? (
            filtered.length ? (
              <>
                <div className="calendar-month-shell">
                  <table className="calendar-month-table">
                    <caption className="sr-only">{calendar.label} content calendar. Times are shown in UTC.</caption>
                    <thead>
                      <tr>{WEEKDAYS.map((weekday) => <th key={weekday} scope="col">{weekday.slice(0, 3)}</th>)}</tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 6 }, (_, weekIndex) => (
                        <tr key={weekIndex}>
                          {calendar.days.slice(weekIndex * 7, weekIndex * 7 + 7).map((day) => (
                            <CalendarDayCell key={day.dateKey} day={day} todayKey={todayKey} />
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <section className="calendar-agenda" aria-labelledby="agenda-title">
                  <div className="calendar-section-heading">
                    <div>
                      <p className="eyebrow">Agenda</p>
                      <h2 id="agenda-title">Detailed schedule</h2>
                    </div>
                    <p>UTC · full destination and state detail</p>
                  </div>
                  {[...grouped].map(([date, items]) => (
                    <section className="calendar-day" key={date}>
                      <time dateTime={date}>{dayLabel(date)}</time>
                      <div>
                        {items.map((item) => <CalendarItem key={item.id} item={item} />)}
                      </div>
                    </section>
                  ))}
                </section>
              </>
            ) : (
              <div className="calendar-empty filtered-empty">
                <p className="eyebrow">No matches</p>
                <h2>Nothing matches these filters.</h2>
                <p>Your publishing schedule is still intact. Clear the filters to return to the full calendar.</p>
                <Link className="secondary-button" href={calendarHref(brand.id, monthStart, { brand: brand.id, campaign: "all", channel: "all", status: "all" })}>Clear filters</Link>
              </div>
            )
          ) : (
            <div className="calendar-empty">
              <p className="eyebrow">No scheduled content</p>
              <h2>Your calendar is deliberately empty.</h2>
              <p>Approve a current Content Version in Content Studio, then choose an exact connected destination and time.</p>
              <Link className="secondary-button" href={`/brands/${encodeURIComponent(brand.id)}/campaigns`}>Review Campaigns</Link>
            </div>
          )}
        </section>

        <DestinationHealth destinations={destinations} brandCount={visibleBrands.length} />
      </main>
      <PilotMobileNav brandId={brand.id} active="Calendar" />
    </div>
  );
}

function CalendarDayCell({ day, todayKey }: {
  day: ReturnType<typeof buildCalendarMonth<CalendarEntry>>["days"][number];
  todayKey: string;
}) {
  const visible = day.entries.slice(0, 2);
  const remaining = day.entries.length - visible.length;
  return (
    <td className={`calendar-month-cell${day.inMonth ? "" : " outside-month"}${day.dateKey === todayKey ? " today" : ""}`}>
      <div className="calendar-day-number-row">
        <time dateTime={day.dateKey} aria-current={day.dateKey === todayKey ? "date" : undefined}>{day.dayNumber}</time>
        {day.entries.length ? <span className="calendar-cell-count" aria-label={`${day.entries.length} ${day.entries.length === 1 ? "item" : "items"}`}>{day.entries.length}</span> : null}
      </div>
      <div className="calendar-cell-entries">
        {visible.map((entry) => (
          <Link
            key={entry.id}
            className={`calendar-cell-entry ${entry.status}`}
            href={`/brands/${encodeURIComponent(entry.brandId)}/campaigns/${encodeURIComponent(entry.campaignId)}`}
            title={`${entry.brandName}: ${entry.campaignName} — ${title(entry.status)}`}
          >
            <span className="calendar-cell-line">
              <time dateTime={entry.scheduledFor}>{timeLabel(entry.scheduledFor)}</time>
              <span>{title(entry.channel)}</span>
            </span>
            <strong>{entry.campaignName}</strong>
            <small>{title(entry.status)}</small>
          </Link>
        ))}
        {remaining > 0 ? <span className="calendar-more">+{remaining} more</span> : null}
      </div>
    </td>
  );
}

function CalendarItem({ item }: { item: CalendarEntry }) {
  const retry = item.status === "failed";
  const cancel = item.status === "scheduled" || item.status === "manual-required";
  return (
    <article className="calendar-item">
      <div className="calendar-time">
        <time dateTime={item.scheduledFor}>{timeLabel(item.scheduledFor)}</time>
        <span>{title(item.channel)}</span>
      </div>
      <div className="calendar-copy">
        <div className="calendar-copy-heading">
          <Link href={`/brands/${encodeURIComponent(item.brandId)}/campaigns/${encodeURIComponent(item.campaignId)}`}>{item.campaignName}</Link>
          <span>{item.brandName}</span>
        </div>
        <p>Version {item.version} · {item.contentType} · {item.accountRef}</p>
        <small>{item.status === "unknown" ? "Outcome requires reconciliation" : item.attemptCount ? `${item.attemptCount} of 3 attempts` : "Not dispatched"}</small>
      </div>
      <div className="calendar-state">
        <span className={`publish-state ${item.status}`}>{title(item.status)}</span>
        <div className="calendar-item-actions">
          {retry && item.attemptCount < 3 ? (
            <form action={retryPublishAction.bind(null, item.brandId, item.id)}><button className="tertiary-button">Retry</button></form>
          ) : null}
          {cancel ? (
            <form action={cancelPublishAction.bind(null, item.brandId, item.id)}><button className="tertiary-button">Cancel</button></form>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function DestinationHealth({ destinations, brandCount }: { destinations: DestinationView[]; brandCount: number }) {
  const needsAttention = destinations.filter((destination) => destination.status !== "connected").length;
  return (
    <details className="destination-health">
      <summary>
        <span>
          <strong>Destination health</strong>
          <small>{destinations.length ? `${destinations.length} ${destinations.length === 1 ? "account" : "accounts"} across ${brandCount} ${brandCount === 1 ? "Brand" : "Brands"}` : "No publishing accounts connected"}</small>
        </span>
        <span className={needsAttention ? "destination-attention" : "destination-ok"}>{needsAttention ? `${needsAttention} need attention` : "Healthy"}</span>
      </summary>
      <div className="connection-list">
        {destinations.length ? destinations.map((destination) => (
          <div className="connection-row" key={`${destination.brandId}:${destination.id}`}>
            <div>
              <span className={`channel-dot ${destination.channel}`} aria-hidden="true" />
              <strong>{destination.displayName}</strong>
              <small>{destination.brandName} · {title(destination.channel)} · {destination.accountRef}</small>
            </div>
            <span className={`connection-state ${destination.status}`}>{destination.status === "connected" ? "Connected" : destination.status === "reconnect-required" ? "Reconnect" : "Disabled"}</span>
            <p>{destination.capabilities.length ? destination.capabilities.map((capability) => capability.replace("publish-", "")).join(", ") : "Manual publishing only"}</p>
          </div>
        )) : (
          <div className="connection-empty">
            <strong>No publishing accounts connected</strong>
            <p>Content can still be approved. Scheduling stays unavailable and manual publishing remains explicit.</p>
          </div>
        )}
        <div className="manual-note">
          <strong>Manual fallback remains explicit</strong>
          <p>Unsupported formats, missing permissions and disabled accounts are never presented as automatically publishable.</p>
        </div>
      </div>
    </details>
  );
}

function group(items: CalendarEntry[]) {
  const map = new Map<string, CalendarEntry[]>();
  for (const item of items) {
    const key = item.scheduledFor.slice(0, 10);
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return map;
}

function normaliseChannel(value: string | undefined): CalendarChannel | "all" {
  return CHANNELS.includes(value as CalendarChannel) ? value as CalendarChannel : "all";
}

function normaliseStatus(value: string | undefined): CalendarStatus | "all" {
  return STATUSES.includes(value as CalendarStatus) ? value as CalendarStatus : "all";
}

function calendarHref(
  routeBrandId: string,
  month: Date,
  filters: { brand: string; campaign: string; channel: CalendarChannel | "all"; status: CalendarStatus | "all" },
) {
  const query = new URLSearchParams({ month: calendarMonthKey(month) });
  if (filters.brand !== routeBrandId) query.set("brand", filters.brand);
  if (filters.campaign !== "all") query.set("campaign", filters.campaign);
  if (filters.channel !== "all") query.set("channel", filters.channel);
  if (filters.status !== "all") query.set("status", filters.status);
  return `/brands/${encodeURIComponent(routeBrandId)}/calendar?${query.toString()}`;
}

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
}

function title(value: string) {
  return value.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}
