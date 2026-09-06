import { cookies } from "next/headers";

export type HunterRunStatus = {
  runId: string;
  trigger: "manual" | "scheduled";
  status: "running" | "succeeded" | "failed";
  startedAt: string;
  completedAt?: string;
  evidenceCount: number;
  candidateCount: number;
  opportunityCount: number;
  degradedSources?: string[];
  failureCode?: string;
  failureMessage?: string;
};

const apiBase = () => (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");

export async function getLatestHunterRun(brandId?: string): Promise<HunterRunStatus | null | undefined> {
  if (!brandId) return undefined;
  const token = (await cookies()).get("kairo_access_token")?.value;
  if (!token) return undefined;
  const response = await fetch(`${apiBase()}/api/v1/brands/${encodeURIComponent(brandId)}/hunter-runs/latest`, {
    cache: "no-store",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) return undefined;
  return await response.json() as HunterRunStatus | null;
}
