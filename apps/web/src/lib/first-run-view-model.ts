const AUTH_ERRORS = new Map<string, string>([
  ["Authentication service is temporarily unavailable. Please try again.", "Authentication is temporarily unavailable. Please try again."],
  ["Authentication session expired. Please sign in again.", "Your sign-in session expired. Please start again."],
  ["Identity provider did not return an access token.", "Sign-in could not be completed. Please try again."],
  ["Authentication failed. Please try again.", "Sign-in could not be completed. Please try again."],
]);

export function signInRecoveryView(error: string | undefined) {
  const normalized = error?.trim();
  if (!normalized) {
    return {
      eyebrow: "Welcome back",
      title: "Continue to Kairo",
      description: "Sign in securely to return to your Workspace and Brands.",
      actionLabel: "Continue securely",
      errorMessage: null,
    };
  }

  return {
    eyebrow: "Sign-in needs attention",
    title: "Try again securely",
    description: "Kairo could not complete the previous sign-in attempt. Your Workspace and Brand data were not changed.",
    actionLabel: "Try sign in again",
    errorMessage: AUTH_ERRORS.get(normalized) ?? "We couldn’t complete sign-in. Please try again.",
  };
}
