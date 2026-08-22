import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../app/source-options.tsx", import.meta.url), "utf8");

describe("VS-76 Brand source choices", () => {
  it("presents independent, combinable channel choices with accurate eligibility copy", () => {
    expect(source).toContain("<fieldset");
    expect(source).toContain("<legend>Choose your connections</legend>");
    expect(source).toContain('name="connect-instagram" type="checkbox"');
    expect(source).toContain('name="connect-facebook-instagram" type="checkbox"');
    expect(source).toContain('name="connect-facebook" type="checkbox"');
    expect(source).toContain("Recommended");
    expect(source).toContain("A Facebook Page is not required");
  });

  it("describes every choice for assistive technology", () => {
    expect(source.match(/aria-describedby=/g)).toHaveLength(3);
    expect(source).toContain('id="instagram-source-help"');
    expect(source).toContain('id="facebook-instagram-source-help"');
    expect(source).toContain('id="facebook-source-help"');
  });
});
