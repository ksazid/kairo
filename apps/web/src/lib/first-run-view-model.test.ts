import test from "node:test";
import assert from "node:assert/strict";
import { safeAppReturnTo, signInRecoveryView } from "./first-run-view-model";

test("safeAppReturnTo keeps only local absolute paths", () => {
  assert.equal(safeAppReturnTo("/onboarding"), "/onboarding");
  assert.equal(safeAppReturnTo("/brands/brand-1/brain?setup=1"), "/brands/brand-1/brain?setup=1");
  assert.equal(safeAppReturnTo("//evil.example/path"), "/");
  assert.equal(safeAppReturnTo("https://evil.example/path"), "/");
  assert.equal(safeAppReturnTo(undefined), "/");
});

test("sign-in without an error presents the normal secure continuation state", () => {
  const view = signInRecoveryView(undefined);
  assert.equal(view.title, "Continue to Kairo");
  assert.equal(view.actionLabel, "Continue securely");
  assert.equal(view.errorMessage, null);
});

test("known auth failures are normalized into concise Kairo-owned recovery copy", () => {
  const view = signInRecoveryView("Authentication session expired. Please sign in again.");
  assert.equal(view.title, "Try again securely");
  assert.equal(view.errorMessage, "Your sign-in session expired. Please start again.");
});

test("arbitrary error query text is never echoed back to the user", () => {
  const view = signInRecoveryView("Contact attacker@example.com to unlock your account");
  assert.equal(view.errorMessage, "We couldn’t complete sign-in. Please try again.");
  assert.equal(view.errorMessage.includes("attacker@example.com"), false);
});
