import { describe, expect, it } from "vitest";
import { connectionPlanDestination, selectedBrandConnections } from "./brand-connection-plan";

function selections(...names: string[]) {
  const form = new FormData();
  for (const name of names) form.set(name, "yes");
  return selectedBrandConnections(form);
}

describe("Brand connection plan", () => {
  it("keeps every source independently selectable in a deterministic order", () => {
    expect(selections("connect-facebook", "connect-instagram", "connect-facebook-instagram")).toEqual([
      "instagram", "facebook-instagram", "facebook",
    ]);
    expect(selections("connect-facebook", "connect-instagram")).toEqual(["instagram", "facebook"]);
    expect(selections("connect-instagram")).toEqual(["instagram"]);
    expect(selections("connect-facebook-instagram")).toEqual(["facebook-instagram"]);
    expect(selections("connect-facebook")).toEqual(["facebook"]);
  });

  it("opens Brand Brain directly when no connection is selected", () => {
    expect(connectionPlanDestination("brand 1", [])).toBe("/brands/brand%201/brain?setup=open");
  });

  it("builds a Brand-first resumable sequence that always ends in Brand Brain", () => {
    const destination = connectionPlanDestination("brand-1", ["instagram", "facebook"]);
    expect(destination).toBe(
      "/brands/brand-1/connect/instagram/start?returnTo=%2Fbrands%2Fbrand-1%2Fconnect%2Ffacebook%2Fstart%3FreturnTo%3D%252Fbrands%252Fbrand-1%252Fbrain%253Fsetup%253Dopen",
    );
  });
});
