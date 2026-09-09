import type { HunterScheduleRepository } from "@kairo/domain/hunter-schedule";

export interface ScheduledHunterExecutionPort {
  runScheduled(accountId: string, brandId: string): Promise<void>;
}

export class HunterBackgroundScheduler {
  constructor(
    private readonly schedules: HunterScheduleRepository,
    private readonly executor: ScheduledHunterExecutionPort,
    private readonly leaseSeconds = 15 * 60,
  ) {}

  async runOnce(workerId: string, now = new Date().toISOString()): Promise<number> {
    const claims = await this.schedules.claimDue(workerId, now, this.leaseSeconds, 3);
    for (const claim of claims) {
      try {
        await this.executor.runScheduled(claim.accountId, claim.brandId);
      } finally {
        await this.schedules.releaseClaim(claim.accountId, claim.brandId, workerId, new Date().toISOString());
      }
    }
    return claims.length;
  }
}

export function hunterSchedulerEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.KAIRO_HUNTER_SCHEDULER_ENABLED?.trim().toLowerCase() === "true";
}
