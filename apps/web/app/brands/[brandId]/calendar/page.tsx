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
  type CalendarView,
} from "../../../../src/lib/calendar-view-model";
import { KairoProductShell } from "../../../kairo-product-shell";
import { KairoIcon } from "../../../kairo-icons";
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
type FrozenCalendarStatus = "all" | "scheduled" | "publishing" | "published" | "needs-attention";
type CalendarNavigationState = { brand: string; channel: CalendarChannel | "all"; status: FrozenCalendarStatus };
type RangeState = { date?: string; month?: string };

const CHANNELS: CalendarChannel[] = ["instagram", "facebook", "linkedin", "manual"];
const STATUS_FILTERS: FrozenCalendarStatus[] = ["all", "scheduled", "publishing", "published", "needs-attention"];
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
  const statusFilter = normaliseFrozenStatus(messages.status);

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

  const baseFiltered = applyCalendarFilters(entries, {
    brandId: brandFilter,
    channel: channelFilter,
    status: "all",
  });
  const filtered = baseFiltered
    .filter((entry) => matchesFrozenStatus(entry.status, statusFilter))
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
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
    <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Calendar" pageLabel="Calendar">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main kcal-main">
        <header className="kcal-hero">
          <div>
            <h1>Calendar</h1>
            <p className="lede">See what’s scheduled, publishing, and already live.</p>
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
            <Link className="secondary-button kcal-today" href={todayHref}>Today</Link>
            <Link className="kcal-icon-button" href={previousHref} aria-label={`Previous ${view === "week" ? "week" : "month"}`}>
              <KairoIcon name="arrow-left" />
            </Link>
            <div>
              <span>{view === "week" ? "Week" : view === "month" ? "Month" : "Agenda"}</span>
              <strong>{view === "week" ? week.label : month.label}</strong>
            </div>
            <Link className="kcal-icon-button" href={nextHref} aria-label={`Next ${view === "week" ? "week" : "month"}`}>
              <KairoIcon name="arrow-right" />
            </Link>
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
              {CHANNELS.map((channel) => <option key={channel} value={channel}>{channelLabel(channel)}</option>)}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select name="status" defaultValue={statusFilter}>
              {STATUS_FILTERS.map((status) => <option key={status} value={status}>{frozenStatusFilterLabel(status)}</option>)}
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
                              <Link key={entry.id} href={contentHref(entry)} className={`kcal-month-item ${frozenStatusKey(entry.status)}`}>
                                <span>{timeLabel(entry.scheduledFor)} · {channelLabel(entry.channel)}</span>
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

            {view === "agenda" ? <Agenda grouped={grouped} /> : null}
            {view !== "agenda" ? <div className="kcal-mobile-agenda"><Agenda grouped={grouped} /></div> : null}
          </>
        ) : (
          <section className="kcal-empty">
            <h2>{activeFilters ? "No content matches these filters." : "Your calendar is clear."}</h2>
            <p>{activeFilters ? "Clear the filters to return to the full schedule." : "Approved content will appear here when it is published now or scheduled for later."}</p>
            {activeFilters ? <Link className="secondary-button" href={clearFiltersHref(brand.id, view, anchorDay, monthStart)}>Clear filters</Link> : null}
          </section>
        )}
      </main>
    </KairoProductShell>
  );
}

function Agenda({ grouped }: { grouped: Map<string, CalendarEntry[]> }) {
  return (
    <section className="kcal-agenda" aria-labelledby="kcal-agenda-title">
      <div className="kcal-section-heading">
        <div>
          <h2 id="kcal-agenda-title">Agenda</h2>
          <p>Scheduled and published content grouped by day.</p>
        </div>
        <small>Times shown in UTC</small>
      </div>
      {[...grouped].map(([date, items]) => (
        <section className="kcal-agenda-day" id={`agenda-${date}`} key={date}>
          <time dateTime={date}>{dayLabel(date)}</time>
          <div>{items.map((item) => <CalendarItem key={item.id} item={item} />)}</div>
        </section>
      ))}
    </section>
  );
}

function CompactCalendarItem({ item }: { item: CalendarEntry }) {
  return (
    <Link className={`kcal-compact-item ${frozenStatusKey(item.status)}`} href={contentHref(item)}>
      <span>{timeLabel(item.scheduledFor)} · {channelLabel(item.channel)}</span>
      <strong>{item.contentLabel}</strong>
      <small>{frozenStatusLabel(item.status)}</small>
    </Link>
  );
}

function CalendarItem({ item }: { item: CalendarEntry }) {
  const retry = item.status === "failed";
  const cancel = item.status === "scheduled" || item.status === "manual-required";
  return (
    <article className="kcal-item" data-status={frozenStatusKey(item.status)}>
      <Link className="kcal-item-thumbnail" href={contentHref(item)} aria-label={`Open ${item.contentLabel}`}>
        <KairoIcon name={item.contentType === "video" ? "video" : "photo"} />
      </Link>
      <div className="kcal-item-time">
        <time dateTime={item.scheduledFor}>{timeLabel(item.scheduledFor)}</time>
        <span>{channelLabel(item.channel)}</span>
      </div>
      <div className="kcal-item-copy">
        <Link href={contentHref(item)}>{item.contentLabel}</Link>
        <p>{item.brandName}{item.contentType ? ` · ${formatLabel(item.contentType)}` : ""}</p>
      </div>
      <div className="kcal-item-state">
        <span className={`publish-state ${frozenStatusKey(item.status)}`}>{frozenStatusLabel(item.status)}</span>
        <div className="kcal-item-actions">
          {retry && item.attemptCount < 3 ? (
            <form action={retryPublishAction.bind(null, item.brandId, item.id)}><button className="tertiary-button" type="submit">Retry</button></form>
          ) : null}
          {cancel ? (
            <form action={cancelPublishAction.bind(null, item.brandId, item.id)}><button className="tertiary-button" type="submit">Cancel schedule</button></form>
          ) : null}
          <Link className="tertiary-button" href={contentHref(item)}>{frozenStatusKey(item.status) === "needs-attention" ? "Fix" : "View content"}</Link>
        </div>
      </div>
    </article>
  );
}

function contentHref(item: CalendarEntry): string {
  return `/brands/${encodeURIComponent(item.brandId)}/content/${encodeURIComponent(item.campaignId)}/${encodeURIComponent(item.assetId)}`;
}

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

function normaliseFrozenStatus(value?: string): FrozenCalendarStatus {
  return STATUS_FILTERS.includes(value as FrozenCalendarStatus) ? value as FrozenCalendarStatus : "all";
}

function matchesFrozenStatus(value: PublishCommandView["status"], filter: FrozenCalendarStatus): boolean {
  if (filter === "all") return true;
  if (filter === "scheduled") return value === "scheduled";
  if (filter === "publishing") return value === "dispatching";
  if (filter === "published") return value === "published";
  return ["failed", "unknown", "manual-required"].includes(value);
}

function frozenStatusKey(value: PublishCommandView["status"]): "scheduled" | "publishing" | "published" | "needs-attention" {
  if (value === "scheduled") return "scheduled";
  if (value === "dispatching") return "publishing";
  if (value === "published") return "published";
  return "needs-attention";
}

function frozenStatusLabel(value: PublishCommandView["status"]): string {
  const key = frozenStatusKey(value);
  if (key === "needs-attention") return "Needs attention";
  return title(key);
}

function frozenStatusFilterLabel(value: FrozenCalendarStatus): string {
  if (value === "all") return "All statuses";
  if (value === "needs-attention") return "Needs attention";
  return title(value);
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

function channelLabel(value: string): string {
  if (value.toLowerCase() === "youtube") return "YouTube";
  if (value.toLowerCase() === "linkedin") return "LinkedIn";
  if (value.toLowerCase() === "manual") return "Manual";
  return title(value);
}

function formatLabel(value: string): string {
  if (value.toLowerCase() === "image") return "Post";
  return title(value);
}

function title(value: string): string {
  return value.replaceAll("-", " ").replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}
