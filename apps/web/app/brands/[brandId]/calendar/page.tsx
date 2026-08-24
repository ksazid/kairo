import Link from "next/link";
import {
  getBrand,
  getBrands,
  getCalendar,
  getCampaigns,
  type PublishCommandView,
} from "../../../../src/lib/kairo-api";
import {
  addCalendarMonths,
  addCalendarWeeks,
  applyCalendarFilters,
  buildCalendarMonth,
  buildCalendarWeek,
  calendarDayKey,
  calendarMonthKey,
  calendarRangeIso,
  calendarWeekRangeIso,
  isCalendarView,
  parseCalendarDay,
  parseCalendarMonth,
  type CalendarChannel,
  type CalendarStatus,
  type CalendarView,
} from "../../../../src/lib/calendar-view-model";
import { KairoProductShell } from "../../../kairo-product-shell";
import { cancelPublishAction, retryPublishAction } from "./actions";
import "./calendar-v2.css";

type Params = Promise<{ brandId: string }>;
type Search = Promise<{
  notice?: string;
  error?: string;
  view?: string;
  date?: string;
  month?: string;
  brand?: string;
  channel?: string;
  status?: string;
}>;

type CalendarEntry = PublishCommandView & { brandName: string; contentLabel: string };

const CHANNELS: CalendarChannel[] = ["instagram", "facebook", "linkedin", "manual"];
const STATUSES: CalendarStatus[] = ["scheduled", "dispatching", "published", "failed", "unknown", "manual-required", "cancelled"];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function CalendarPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { brandId } = await params;
  const [brand, messages] = await Promise.all([getBrand(brandId), searchParams]);
  if (!brand) return null;

  const view: CalendarView = isCalendarView(messages.view) ? messages.view : "week";
  const anchorDay = parseCalendarDay(messages.date);
  const monthStart = parseCalendarMonth(messages.month, anchorDay);
  const range = view === "week" ? calendarWeekRangeIso(anchorDay) : calendarRangeIso(monthStart);

  const workspaceBrandsResult = await getBrands(brand.workspaceId);
  const workspaceBrands = workspaceBrandsResult.length ? workspaceBrandsResult : [brand];
  const requestedBrand = messages.brand ?? brand.id;
  const brandFilter = requestedBrand === "all" || workspaceBrands.some((candidate) => candidate.id === requestedBrand)
    ? requestedBrand
    : brand.id;
  const visibleBrands = brandFilter === "all"
    ? workspaceBrands
    : [workspaceBrands.find((candidate) => candidate.id === brandFilter) ?? brand];
  const channelFilter = normaliseChannel(messages.channel);
  const statusFilter = normaliseStatus(messages.status);

  const bundles = await Promise.all(visibleBrands.map(async (visibleBrand) => {
    const [commands, campaigns] = await Promise.all([
      getCalendar(visibleBrand.id, range.from, range.to),
      getCampaigns(visibleBrand.id),
    ]);
    return { brand: visibleBrand, commands, campaigns };
  }));

  const entries: CalendarEntry[] = bundles.flatMap(({ brand: bundleBrand, campaigns, commands }) => {
    const campaignNames = new Map(campaigns.map((campaign) => [campaign.id, campaign.name]));
    return commands.map((command) => ({
      ...command,
      brandName: bundleBrand.name,
      contentLabel: campaignNames.get(command.campaignId) ?? "Content",
    }));
  });

  const filtered = applyCalendarFilters(entries, {
    brandId: brandFilter,
    channel: channelFilter,
    status: statusFilter,
  }).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  const week = buildCalendarWeek(anchorDay, filtered);
  const month = buildCalendarMonth(monthStart, filtered);
  const grouped = group(filtered);
  const todayKey = calendarDayKey(parseCalendarDay(undefined, new Date()));
  const activeFilters = brandFilter !== brand.id || channelFilter !== "all" || statusFilter !== "all";
  const state: CalendarNavigationState = { brand: brandFilter, channel: channelFilter, status: statusFilter };

  const previousHref = view === "week"
    ? calendarHref(brand.id, "week", { date: calendarDayKey(addCalendarWeeks(anchorDay, -1)) }, state)
    : calendarHref(brand.id, view, { month: calendarMonthKey(addCalendarMonths(monthStart, -1)) }, state);
  const nextHref = view === "week"
    ? calendarHref(brand.id, "week", { date: calendarDayKey(addCalendarWeeks(anchorDay, 1)) }, state)
    : calendarHref(brand.id, view, { month: calendarMonthKey(addCalendarMonths(monthStart, 1)) }, state);
  const todayHref = calendarHref(brand.id, "week", { date: todayKey }, state);

  return (
    <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Calendar">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main kcal-main">
        <header className="kcal-hero">
          <div>
            <p className="eyebrow">Calendar</p>
            <h1>Plan the week. Keep publishing visible.</h1>
            <p className="lede">See what is scheduled, what published, and what needs attention without turning Calendar into another editor.</p>
          </div>
          <div className="kcal-hero-actions">
            <Link className="secondary-button" href={todayHref}>Today</Link>
            <Link className="primary-button" href={`/brands/${encodeURIComponent(brand.id)}/content`}>Open Content</Link>
          </div>
        </header>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        <section className="kcal-toolbar" aria-label="Calendar controls">
          <nav className="kcal-view-tabs" aria-label="Calendar view">
            {(["week", "month", "agenda"] as const).map((candidate) => (
              <Link
                key={candidate}
                className={candidate === view ? "active" : undefined}
                aria-current={candidate === view ? "page" : undefined}
                href={candidate === "week"
                  ? calendarHref(brand.id, candidate, { date: calendarDayKey(anchorDay) }, state)
                  : calendarHref(brand.id, candidate, { month: calendarMonthKey(monthStart) }, state)}
              >
                {title(candidate)}
              </Link>
            ))}
          </nav>

          <div className="kcal-range-nav">
            <Link className="kcal-icon-button" href={previousHref} aria-label={`Previous ${view === "week" ? "week" : "month"}`}>‹</Link>
            <div>
              <span>{view === "week" ? "Week" : view === "month" ? "Month" : "Agenda"}</span>
              <strong>{view === "week" ? week.label : month.label}</strong>
            </div>
            <Link className="kcal-icon-button" href={nextHref} aria-label={`Next ${view === "week" ? "week" : "month"}`}>›</Link>
          </div>
        </section>

        <form className="kcal-filters" method="get" aria-label="Filter calendar">
          <input type="hidden" name="view" value={view} />
          {view === "week"
            ? <input type="hidden" name="date" value={calendarDayKey(anchorDay)} />
            : <input type="hidden" name="month" value={calendarMonthKey(monthStart)} />}
          <label>
            <span>Brand</span>
            <select name="brand" defaultValue={brandFilter}>
              <option value="all">All Brands</option>
              {workspaceBrands.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
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
              {STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </select>
          </label>
          <div className="kcal-filter-actions">
            <button className="secondary-button" type="submit">Apply</button>
            {activeFilters ? <Link className="tertiary-button" href={clearFiltersHref(brand.id, view, anchorDay, monthStart)}>Clear</Link> : null}
          </div>
        </form>

        <p className="kcal-summary" role="status">
          {filtered.length} {filtered.length === 1 ? "item" : "items"}
          {brandFilter === "all" ? ` across ${visibleBrands.length} Brands` : ` for ${visibleBrands[0]?.name ?? brand.name}`}
        </p>

        {filtered.length ? (
          <>
            {view === "week" ? (
              <section className="kcal-week" aria-label={`${week.label} schedule`}>
                <nav className="kcal-week-strip" aria-label="Days this week">
                  {week.days.map((day) => (
                    <Link
                      key={day.dateKey}
                      href={`${calendarHref(brand.id, "week", { date: day.dateKey }, state)}#agenda-${day.dateKey}`}
                      className={day.dateKey === todayKey ? "today" : undefined}
                      aria-current={day.dateKey === todayKey ? "date" : undefined}
                    >
                      <span>{day.weekday}</span>
                      <strong>{day.dayNumber}</strong>
                      {day.entries.length ? <small>{day.entries.length}</small> : null}
                    </Link>
                  ))}
                </nav>
                <div className="kcal-week-grid" role="table" aria-label={`${week.label} publishing schedule`}>
                  {week.days.map((day) => (
                    <section className="kcal-week-day" key={day.dateKey} role="rowgroup">
                      <header className={day.dateKey === todayKey ? "today" : undefined}>
                        <span>{day.weekday}</span>
                        <strong>{day.dayNumber}</strong>
                      </header>
                      <div className="kcal-week-items">
                        {day.entries.length ? day.entries.map((entry) => <CompactCalendarItem key={entry.id} item={entry} />) : <span className="kcal-open-day">Open</span>}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            ) : null}

            {view === "month" ? (
              <div className="kcal-month-grid">
                <table>
                  <caption className="sr-only">{month.label} publishing calendar. Times are shown in UTC.</caption>
                  <thead><tr>{WEEKDAYS.map((weekday) => <th key={weekday} scope="col">{weekday.slice(0, 3)}</th>)}</tr></thead>
                  <tbody>
                    {Array.from({ length: 6 }, (_, weekIndex) => (
                      <tr key={weekIndex}>
                        {month.days.slice(weekIndex * 7, weekIndex * 7 + 7).map((day) => (
                          <td key={day.dateKey} className={`${day.inMonth ? "" : "outside"}${day.dateKey === todayKey ? " today" : ""}`}>
                            <time dateTime={day.dateKey}>{day.dayNumber}</time>
                            {day.entries.slice(0, 2).map((entry) => (
                              <Link key={entry.id} href={`/brands/${encodeURIComponent(entry.brandId)}/content`} className={`kcal-month-item ${entry.status}`}>
                                <span>{timeLabel(entry.scheduledFor)}</span>
                                <strong>{entry.contentLabel}</strong>
                              </Link>
                            ))}
                            {day.entries.length > 2 ? <small>+{day.entries.length - 2} more</small> : null}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <Agenda grouped={grouped} brandId={brand.id} />
          </>
        ) : (
          <section className="kcal-empty">
            <p className="eyebrow">Nothing planned here</p>
            <h2>{activeFilters ? "No content matches these filters." : "Your calendar is clear."}</h2>
            <p>{activeFilters ? "Clear the filters to return to the full schedule." : "Approve content, then publish now or schedule it from Preview."}</p>
            {activeFilters
              ? <Link className="secondary-button" href={clearFiltersHref(brand.id, view, anchorDay, monthStart)}>Clear filters</Link>
              : <Link className="primary-button" href={`/brands/${encodeURIComponent(brand.id)}/content`}>Open Content</Link>}
          </section>
        )}
      </main>
    </KairoProductShell>
  );
}

function Agenda({ grouped, brandId }: { grouped: Map<string, CalendarEntry[]>; brandId: string }) {
  return (
    <section className="kcal-agenda" aria-labelledby="kcal-agenda-title">
      <div className="kcal-section-heading">
        <div>
          <p className="eyebrow">Agenda</p>
          <h2 id="kcal-agenda-title">Publishing schedule</h2>
        </div>
        <small>Times shown in UTC</small>
      </div>
      {[...grouped].map(([date, items]) => (
        <section className="kcal-agenda-day" id={`agenda-${date}`} key={date}>
          <time dateTime={date}>{dayLabel(date)}</time>
          <div>{items.map((item) => <CalendarItem key={item.id} item={item} brandId={item.brandId} />)}</div>
        </section>
      ))}
    </section>
  );
}

function CompactCalendarItem({ item }: { item: CalendarEntry }) {
  return (
    <Link className={`kcal-compact-item ${item.status}`} href={`/brands/${encodeURIComponent(item.brandId)}/content`}>
      <span>{timeLabel(item.scheduledFor)} · {title(item.channel)}</span>
      <strong>{item.contentLabel}</strong>
      <small>{statusLabel(item.status)}</small>
    </Link>
  );
}

function CalendarItem({ item, brandId }: { item: CalendarEntry; brandId: string }) {
  const retry = item.status === "failed";
  const cancel = item.status === "scheduled" || item.status === "manual-required";
  return (
    <article className="kcal-item">
      <div className="kcal-item-time">
        <time dateTime={item.scheduledFor}>{timeLabel(item.scheduledFor)}</time>
        <span>{title(item.channel)}</span>
      </div>
      <div className="kcal-item-copy">
        <Link href={`/brands/${encodeURIComponent(item.brandId)}/content`}>{item.contentLabel}</Link>
        <p>{item.brandName}{item.contentType ? ` · ${title(item.contentType)}` : ""}</p>
        <small>{item.status === "unknown" ? "Outcome requires reconciliation" : item.attemptCount ? `${item.attemptCount} of 3 attempts` : "Not dispatched"}</small>
      </div>
      <div className="kcal-item-state">
        <span className={`publish-state ${item.status}`}>{statusLabel(item.status)}</span>
        <div className="kcal-item-actions">
          {retry && item.attemptCount < 3 ? (
            <form action={retryPublishAction.bind(null, brandId, item.id)}><button className="tertiary-button">Retry</button></form>
          ) : null}
          {cancel ? (
            <form action={cancelPublishAction.bind(null, brandId, item.id)}><button className="tertiary-button">Cancel schedule</button></form>
          ) : null}
          <Link className="tertiary-button" href={`/brands/${encodeURIComponent(item.brandId)}/content`}>View content</Link>
        </div>
      </div>
    </article>
  );
}

type CalendarNavigationState = { brand: string; channel: CalendarChannel | "all"; status: CalendarStatus | "all" };
type RangeState = { date?: string; month?: string };

function calendarHref(brandId: string, view: CalendarView, range: RangeState, filters: CalendarNavigationState): string {
  const params = new URLSearchParams({ view });
  if (range.date) params.set("date", range.date);
  if (range.month) params.set("month", range.month);
  if (filters.brand !== brandId) params.set("brand", filters.brand);
  if (filters.channel !== "all") params.set("channel", filters.channel);
  if (filters.status !== "all") params.set("status", filters.status);
  return `/brands/${encodeURIComponent(brandId)}/calendar?${params.toString()}`;
}

function clearFiltersHref(brandId: string, view: CalendarView, anchorDay: Date, monthStart: Date): string {
  return view === "week"
    ? calendarHref(brandId, view, { date: calendarDayKey(anchorDay) }, { brand: brandId, channel: "all", status: "all" })
    : calendarHref(brandId, view, { month: calendarMonthKey(monthStart) }, { brand: brandId, channel: "all", status: "all" });
}

function normaliseChannel(value?: string): CalendarChannel | "all" {
  return value === "instagram" || value === "facebook" || value === "linkedin" || value === "manual" ? value : "all";
}

function normaliseStatus(value?: string): CalendarStatus | "all" {
  return value === "scheduled" || value === "dispatching" || value === "published" || value === "failed" || value === "unknown" || value === "manual-required" || value === "cancelled" ? value : "all";
}

function group(entries: CalendarEntry[]): Map<string, CalendarEntry[]> {
  const grouped = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const date = entry.scheduledFor.slice(0, 10);
    grouped.set(date, [...(grouped.get(date) ?? []), entry]);
  }
  return grouped;
}

function dayLabel(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

function timeLabel(value: string): string {
  return new Date(value).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false });
}

function statusLabel(value: CalendarStatus): string {
  if (value === "manual-required") return "Needs manual publishing";
  if (value === "unknown") return "Needs attention";
  return title(value);
}

function title(value: string): string {
  return value.replaceAll("-", " ").replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}
