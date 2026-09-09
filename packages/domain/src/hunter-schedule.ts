export const HUNTER_SCHEDULE_SCHEMA_VERSION = "1" as const;

export type HunterScheduleCadence = "twice-daily" | "daily" | "weekly";

export interface HunterScheduleRecord {
  schemaVersion: typeof HUNTER_SCHEDULE_SCHEMA_VERSION;
  workspaceId: string;
  brandId: string;
  enabled: boolean;
  cadence: HunterScheduleCadence;
  timezone: string;
  nextRunAt?: string;
  lastClaimedAt?: string;
  leaseOwner?: string;
  leaseExpiresAt?: string;
  updatedAt: string;
}

export interface PutHunterScheduleInput {
  enabled: boolean;
  cadence: HunterScheduleCadence;
  timezone: string;
  now: string;
}

export interface ClaimedHunterSchedule extends HunterScheduleRecord {
  accountId: string;
  nextRunAt: string;
  leaseOwner: string;
  leaseExpiresAt: string;
}

export interface HunterScheduleRepository {
  get(accountId: string, brandId: string): Promise<HunterScheduleRecord | undefined>;
  put(accountId: string, workspaceId: string, brandId: string, input: PutHunterScheduleInput): Promise<HunterScheduleRecord>;
  claimDue(workerId: string, now: string, leaseSeconds: number, limit: number): Promise<ClaimedHunterSchedule[]>;
  releaseClaim(accountId: string, brandId: string, workerId: string, completedAt: string): Promise<HunterScheduleRecord>;
}

export function normalizeHunterScheduleCadence(value: unknown): HunterScheduleCadence {
  if (value === "twice-daily" || value === "daily" || value === "weekly") return value;
  throw new Error("Hunter schedule cadence must be twice-daily, daily, or weekly");
}

export function normalizeHunterScheduleTimezone(value: unknown): string {
  if (typeof value !== "string") throw new Error("Hunter schedule timezone is required");
  const timezone = value.trim();
  if (!timezone || timezone.length > 100) throw new Error("Hunter schedule timezone is invalid");
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }).format(new Date()); }
  catch { throw new Error("Hunter schedule timezone is invalid"); }
  return timezone;
}

export function nextHunterRunAt(cadence: HunterScheduleCadence, from: string): string {
  const start = new Date(from);
  if (!Number.isFinite(start.getTime())) throw new Error("Hunter schedule time is invalid");
  const hours = cadence === "twice-daily" ? 12 : cadence === "daily" ? 24 : 24 * 7;
  return new Date(start.getTime() + hours * 60 * 60 * 1000).toISOString();
}
