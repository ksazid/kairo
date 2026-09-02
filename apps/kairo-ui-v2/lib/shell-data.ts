import { cookies } from "next/headers";

export type ShellBrandOption = {
  id: string;
  name: string;
};

const apiBase = () => (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");

export async function getShellBrandOptions(): Promise<ShellBrandOption[]> {
  const token = (await cookies()).get("kairo_access_token")?.value;
  if (!token) return [];

  const headers = { authorization: `Bearer ${token}` };
  const sessionResponse = await fetch(`${apiBase()}/api/v1/session`, { cache: "no-store", headers });
  if (!sessionResponse.ok) return [];

  const session = await sessionResponse.json() as { workspaces?: Array<{ id: string }> };
  const workspaceId = session.workspaces?.[0]?.id;
  if (!workspaceId) return [];

  const brandsResponse = await fetch(`${apiBase()}/api/v1/workspaces/${encodeURIComponent(workspaceId)}/brands`, { cache: "no-store", headers });
  if (!brandsResponse.ok) return [];

  const brands = await brandsResponse.json() as Array<{ id: string; name: string }>;
  return brands.map(({ id, name }) => ({ id, name }));
}
