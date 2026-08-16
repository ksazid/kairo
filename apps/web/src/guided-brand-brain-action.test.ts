import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { buildBrandBrain } from "./lib/guided-brand-brain-api";
import { buildBrandBrainAction } from "../app/brands/[brandId]/brain/guided-actions";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("./lib/guided-brand-brain-api", () => ({ buildBrandBrain: vi.fn() }));

const redirectSignal = new Error("NEXT_REDIRECT");

function formData(): FormData {
  const form = new FormData();
  form.set("primaryObjective", "grow-audience");
  form.set("publicReferenceUrl", "https://example.com/brand");
  form.set("ownerBoundary", "Never glorify dangerous riding.");
  return form;
}

describe("VS-29 guided Brand Brain redirect control flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(redirect).mockImplementation(() => {
      throw redirectSignal;
    });
  });

  it("does not catch a successful Next.js redirect and turn it into NEXT_REDIRECT error UI", async () => {
    vi.mocked(buildBrandBrain).mockResolvedValue({
      generatorStatus: "generated",
      proposedCount: 3,
    } as unknown as Awaited<ReturnType<typeof buildBrandBrain>>);

    await expect(buildBrandBrainAction("brand 1", formData())).rejects.toBe(redirectSignal);

    expect(redirect).toHaveBeenCalledTimes(1);
    const destination = String(vi.mocked(redirect).mock.calls[0]?.[0]);
    expect(destination).toContain("/brands/brand%201/brain?notice=");
    expect(destination).not.toContain("NEXT_REDIRECT");
  });

  it("keeps genuine Brand Brain build failures on the bounded error redirect", async () => {
    vi.mocked(buildBrandBrain).mockRejectedValue(new Error("Source temporarily unavailable"));

    await expect(buildBrandBrainAction("brand 1", formData())).rejects.toBe(redirectSignal);

    expect(redirect).toHaveBeenCalledTimes(1);
    const destination = String(vi.mocked(redirect).mock.calls[0]?.[0]);
    expect(destination).toBe(
      "/brands/brand%201/brain?error=Source%20temporarily%20unavailable",
    );
  });
});
