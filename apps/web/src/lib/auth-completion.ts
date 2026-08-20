export type AuthCompletionResult =
  | { ok: true }
  | { ok: false; message: string };

export const AUTH_COOKIE_REJECTED_MESSAGE = "Secure session cookie was not accepted. Please clear Kairo site data and sign in again.";
export const AUTH_SESSION_REJECTED_MESSAGE = "Authentication session could not be established. Please sign in again.";
export const AUTH_SERVICE_UNAVAILABLE_MESSAGE = "Authentication service is temporarily unavailable. Please try again.";

export async function verifyAuthCompletion(
  token: string | null,
  rawApiBase: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<AuthCompletionResult> {
  if (!token) return { ok: false, message: AUTH_COOKIE_REJECTED_MESSAGE };

  const apiBase = rawApiBase?.trim().replace(/\/$/, "");
  if (!apiBase) return { ok: false, message: AUTH_SERVICE_UNAVAILABLE_MESSAGE };

  try {
    const response = await fetcher(`${apiBase}/api/v1/session`, {
      method: "GET",
      cache: "no-store",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/json",
      },
    });
    if (!response.ok) return { ok: false, message: AUTH_SESSION_REJECTED_MESSAGE };
    return { ok: true };
  } catch {
    return { ok: false, message: AUTH_SERVICE_UNAVAILABLE_MESSAGE };
  }
}
