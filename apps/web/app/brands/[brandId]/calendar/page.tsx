import Link from "next/link";
import type { SVGProps } from "react";
import {
  getBrand,
  getBrands,
  getCalendar,
  getCampaignDetail,
  getCampaigns,
  type PublishCommandView,
} from "../../../../src/lib/kairo-api";
import { getCarouselReview } from "../../../../src/lib/carousel-review-api";
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
import { KairoIcon, type KairoIconName } from "../../../kairo-icons";
import styles from "./calendar-approved.module.css";

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

type CalendarEntry = PublishCommandView & {
  brandName: string;
  contentLabel: string;
  format: string;
  thumbnailUrl: string | null;
};

type EntryDraft = Omit<CalendarEntry, "thumbnailUrl">;

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
    const details = await Promise.all(campaigns.map((campaign) => getCampaignDetail(visibleBrand.id, campaign.id).catch(() => null)));
    const campaignNames = new Map(campaigns.map((campaign) => [campaign.id, campaign.name]));
    const assetDetails = new Map<string, { topic: string; format: string }>();
    for (const detail of details) {
      if (!detail) continue;
      for (const { asset } of detail.assets) assetDetails.set(asset.id, { topic: asset.topic, format: asset.format });
    }
    const entries: EntryDraft[] = commands.map((command) => {
      const asset = assetDetails.get(command.assetId);
      return {
        ...command,
        brandName: visibleBrand.name,
        contentLabel: asset?.topic || campaignNames.get(command.campaignId) || "Content",
        format: asset?.format || command.contentType,
      };
    });
    return entries;
  }));

  const filteredDrafts = applyCalendarFilters(bundles.flat(), {
    brandId: brandFilter,
    channel: channelFilter,
    status: statusFilter,
  }).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));

  const uniqueCarouselEntries = Array.from(
    new Map(
      filteredDrafts
        .filter((entry) => entry.format.toLowerCase() === "carousel")
        .map((entry) => [`${entry.brandId}:${entry.assetId}`, entry]),
    ).values(),
  );
  const thumbnailPairs = await Promise.all(uniqueCarouselEntries.map(async (entry) => {
    const review = await getCarouselReview(entry.brandId, entry.campaignId, entry.assetId).catch(() => null);
    const thumbnail = review?.slides.find((slide) => Boolean(slide.renderedUrl))?.renderedUrl ?? null;
    return [`${entry.brandId}:${entry.assetId}`, thumbnail] as const;
  }));
  const thumbnails = new Map(thumbnailPairs);
  const filtered: CalendarEntry[] = filteredDrafts.map((entry) => ({
    ...entry,
    thumbnailUrl: thumbnails.get(`${entry.brandId}:${entry.assetId}`) ?? null,
  }));

  const week = buildCalendarWeek(anchorDay, filtered);
  const month = buildCalendarMonth(monthStart, filtered);
  const grouped = group(filtered);
  const selectedKey = calendarDayKey(anchorDay);
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
  const orderedDays = orderedAgendaDays(grouped, selectedKey);

  return (
    <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Calendar" pageLabel="Calendar" variant="portrait-reference">
      <main id="kairo-main-content" tabIndex={-1} className={styles.main}>
        <header className={styles.pageHeader}><h1>Calendar</h1></header>

        <section className={styles.controls} aria-label="Calendar controls">
          <nav className={styles.viewTabs} aria-label="Calendar view">
            <Link href={todayHref}>Today</Link>
            <Link href={calendarHref(brand.id, "week", { date: selectedKey }, state)} data-active={view === "week" || undefined} aria-current={view === "week" ? "page" : undefined}>Week</Link>
            <Link href={calendarHref(brand.id, "month", { month: calendarMonthKey(monthStart) }, state)} data-active={view === "month" || undefined} aria-current={view === "month" ? "page" : undefined}>Month</Link>
            <Link href={calendarHref(brand.id, "agenda", { month: calendarMonthKey(monthStart) }, state)} data-active={view === "agenda" || undefined} aria-current={view === "agenda" ? "page" : undefined}>Agenda</Link>
          </nav>

          <details className={styles.filterMenu}>
            <summary aria-label="Filter calendar" title="Filter calendar" data-active={activeFilters || undefined}><FunnelIcon /></summary>
            <form className={styles.filterPanel} method="get">
              <input type="hidden" name="view" value={view} />
              {view === "week"
                ? <input type="hidden" name="date" value={selectedKey} />
                : <input type="hidden" name="month" value={calendarMonthKey(monthStart)} />}
              <label>
                Brand
                <select name="brand" defaultValue={brandFilter}>
                  <option value="all">All Brands</option>
                  {workspaceBrands.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                </select>
              </label>
              <label>
                Channel
                <select name="channel" defaultValue={channelFilter}>
                  <option value="all">All channels</option>
                  {CHANNELS.map((channel) => <option key={channel} value={channel}>{title(channel)}</option>)}
                </select>
              </label>
              <label>
                Status
                <select name="status" defaultValue={statusFilter}>
                  <option value="all">All statuses</option>
                  {STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                </select>
              </label>
              <div className={styles.filterActions}>
                {activeFilters ? <Link href={clearFiltersHref(brand.id, view, anchorDay, monthStart)}>Clear</Link> : null}
                <button type="submit">Apply</button>
              </div>
            </form>
          </details>
        </section>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        {view === "week" ? (
          <>
            <nav className={styles.weekStrip} aria-label={week.label}>
              <Link className={styles.weekArrow} href={previousHref} aria-label="Previous week"><KairoIcon name="arrow-left" /></Link>
              {week.days.map((day) => (
                <Link
                  key={day.dateKey}
                  className={styles.dayCell}
                  href={calendarHref(brand.id, "week", { date: day.dateKey }, state)}
                  data-active={day.dateKey === selectedKey || undefined}
                  aria-current={day.dateKey === selectedKey ? "date" : undefined}
                >
                  <span>{day.weekday.slice(0, 3)}</span>
                  <strong>{day.dayNumber}</strong>
                  {day.entries.length ? <span className={styles.dayDot} aria-label={`${day.entries.length} scheduled`} /> : <span />}
                </Link>
              ))}
              <Link className={styles.weekArrow} href={nextHref} aria-label="Next week"><KairoIcon name="arrow-right" /></Link>
            </nav>

            {orderedDays.length ? (
              <Agenda groups={orderedDays} />
            ) : (
              <EmptyCalendar activeFilters={activeFilters} />
            )}
          </>
        ) : null}

        {view === "agenda" ? (
          orderedDays.length ? <Agenda groups={orderedDays} /> : <EmptyCalendar activeFilters={activeFilters} />
        ) : null}

        {view === "month" ? (
          filtered.length ? (
            <div className={styles.monthGrid}>
              <table>
                <caption className="sr-only">{month.label} publishing calendar. Times are shown in UTC.</caption>
                <thead><tr>{WEEKDAYS.map((weekday) => <th key={weekday} scope="col">{weekday.slice(0, 3)}</th>)}</tr></thead>
                <tbody>
                  {Array.from({ length: 6 }, (_, weekIndex) => (
                    <tr key={weekIndex}>
                      {month.days.slice(weekIndex * 7, weekIndex * 7 + 7).map((day) => (
                        <td key={day.dateKey} data-outside={!day.inMonth || undefined}>
                          <time dateTime={day.dateKey}>{day.dayNumber}</time>
                          {day.entries.slice(0, 2).map((entry) => (
                            <Link key={entry.id} className={styles.monthItem} href={contentPreviewHref(entry)}>
                              <span>{timeParts(entry.scheduledFor).time}</span>
                              <strong>{entry.contentLabel}</strong>
                            </Link>
                          ))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyCalendar activeFilters={activeFilters} />
        ) : null}
      </main>
    </KairoProductShell>
  );
}

function Agenda({ groups }: { groups: Array<[string, CalendarEntry[]]> }) {
  return (
    <section className={styles.agenda} aria-label="Publishing schedule">
      {groups.map(([date, items]) => (
        <section className={styles.dayGroup} id={`agenda-${date}`} key={date}>
          <header className={styles.dayHeading}>
            <h2>{dayLabel(date)}</h2>
            <span>{items.length} {items.length === 1 ? "item" : "items"}</span>
          </header>
          <div className={styles.dayItems}>
            {items.map((item) => <CalendarCard item={item} key={item.id} />)}
          </div>
        </section>
      ))}
    </section>
  );
}

function CalendarCard({ item }: { item: CalendarEntry }) {
  const time = timeParts(item.scheduledFor);
  const state = calendarState(item.status);
  const motion = /reel|video|short/i.test(item.format);
  return (
    <Link className={styles.itemCard} href={contentPreviewHref(item)} aria-label={`Open ${item.contentLabel} preview`}>
      <div className={styles.timeBlock}>
        <strong>{time.time}</strong>
        <small>{time.period}</small>
      </div>
      <div className={styles.thumbnail}>
        {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" /> : <KairoIcon name={motion ? "video" : "image"} />}
        <span className={styles.platformBadge} data-channel={item.channel}><KairoIcon name={channelIcon(item.channel)} /></span>
      </div>
      <div className={styles.itemCopy}>
        <h3>{item.contentLabel}</h3>
        <span className={styles.channelPill}>{channelFormatLabel(item.channel, item.format)}</span>
      </div>
      <div className={styles.stateBlock}>
        <span className={styles.statusPill} data-state={state.key}>
          <StatusIcon state={state.key} />
          {state.label}
        </span>
        {state.key === "attention" ? <span className={styles.fixPill}>Fix</span> : null}
      </div>
      <span className={styles.chevron} aria-hidden="true"><KairoIcon name="chevron" /></span>
    </Link>
  );
}

function EmptyCalendar({ activeFilters }: { activeFilters: boolean }) {
  return (
    <section className={styles.empty}>
      <h2>{activeFilters ? "No content matches these filters." : "Nothing planned yet."}</h2>
      <p>{activeFilters ? "Clear or change the filters to see the rest of your schedule." : "Approved and scheduled content will appear here."}</p>
    </section>
  );
}

function FunnelIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M4 5h16l-6.3 7.1v5.2l-3.4 1.7v-6.9L4 5Z" /></svg>;
}

function StatusIcon({ state }: { state: "scheduled" | "published" | "attention" | "publishing" | "cancelled" }) {
  if (state === "scheduled") return <ClockIcon />;
  if (state === "published") return <KairoIcon name="check" />;
  if (state === "attention") return <KairoIcon name="warning" />;
  if (state === "publishing") return <KairoIcon name="refresh" />;
  return <span aria-hidden="true">–</span>;
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></svg>;
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

function orderedAgendaDays(grouped: Map<string, CalendarEntry[]>, selected: string): Array<[string, CalendarEntry[]]> {
  const entries = [...grouped.entries()];
  const selectedEntry = entries.find(([date]) => date === selected);
  const before = entries.filter(([date]) => date < selected).sort(([a], [b]) => b.localeCompare(a));
  const after = entries.filter(([date]) => date > selected).sort(([a], [b]) => a.localeCompare(b));
  return [...(selectedEntry ? [selectedEntry] : []), ...before, ...after];
}

function dayLabel(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
}

function timeParts(value: string): { time: string; period: string } {
  const formatted = new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
  const match = formatted.match(/^(.+?)\s(AM|PM)$/i);
  return { time: match?.[1] ?? formatted, period: match?.[2]?.toUpperCase() ?? "UTC" };
}

function statusLabel(value: CalendarStatus): string {
  if (value === "manual-required" || value === "unknown" || value === "failed") return "Needs attention";
  if (value === "dispatching") return "Publishing";
  return title(value);
}

function calendarState(value: CalendarStatus): { key: "scheduled" | "published" | "attention" | "publishing" | "cancelled"; label: string } {
  if (value === "scheduled") return { key: "scheduled", label: "Scheduled" };
  if (value === "published") return { key: "published", label: "Published" };
  if (value === "dispatching") return { key: "publishing", label: "Publishing" };
  if (value === "cancelled") return { key: "cancelled", label: "Cancelled" };
  return { key: "attention", label: "Needs attention" };
}

function channelIcon(value: string): KairoIconName {
  if (value === "instagram") return "instagram";
  if (value === "facebook") return "facebook";
  if (value === "linkedin") return "linkedin";
  return "brand";
}

function channelFormatLabel(channel: string, format: string): string {
  return `${title(channel)} ${formatLabel(format)}`.trim();
}

function formatLabel(value: string): string {
  const normal = value.toLowerCase();
  if (normal === "image") return "Post";
  if (normal === "video") return "Video";
  return title(value);
}

function contentPreviewHref(item: Pick<CalendarEntry, "brandId" | "campaignId" | "assetId">): string {
  return `/brands/${encodeURIComponent(item.brandId)}/content/${encodeURIComponent(item.campaignId)}/${encodeURIComponent(item.assetId)}`;
}

function title(value: string): string {
  return value.replaceAll("-", " ").replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}
