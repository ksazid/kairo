import { expect, test } from "vitest";
import { signInRecoveryView } from "./first-run-view-model";
import { safeReturnTo } from "./oidc-session";

test("canonical safeReturnTo keeps only local same-origin paths", () => {
  expect(safeReturnTo("/onboarding")).toBe("/onboarding");
  expect(safeReturnTo("/brands/brand-1/brain?setup=1")).toBe("/brands/brand-1/brain?setup=1");
  expect(safeReturnTo("//evil.example/path")).toBe("/");
  expect(safeReturnTo("/\\evil.example/path")).toBe("/");
  expect(safeReturnTo("https://evil.example/path")).toBe("/");
  expect(safeReturnTo(undefined)).toBe("/");
});

test("sign-in without an error presents the normal secure continuation state", () => {
  const view = signInRecoveryView(undefined);
  expect(view.title).toBe("Continue to Kairo");
  expect(view.actionLabel).toBe("Continue securely");
  expect(view.errorMessage).toBeNull();
});

test("known auth failures are normalized into concise Kairo-owned recovery copy", () => {
  const view = signInRecoveryView("Authentication session expired. Please sign in again.");
  expect(view.title).toBe("Try again securely");
  expect(view.errorMessage).toBe("Your sign-in session expired. Please start again.");
});

test("arbitrary error query text is never echoed back to the user", () => {
  const view = signInRecoveryView("Contact attacker@example.com to unlock your account");
  expect(view.errorMessage).toBe("We couldn’t complete sign-in. Please try again.");
  expect(view.errorMessage?.includes("attacker@example.com")).toBe(false);
});
