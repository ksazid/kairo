import type { ConceptMockupDto, ConceptMockupFormatDto } from "@kairo/contracts/concept-mockup";

export interface ConceptMockupInput {
  title: string;
  rationale: string;
  whyNow: string;
  developmentDirection: string;
  hook?: string;
  proposedAngle?: string;
  targetAudience?: string;
  objective?: string;
  recommendedFormat?: string;
}

export function buildConceptMockup(input: ConceptMockupInput): ConceptMockupDto {
  const hook = clean(input.hook) ?? required(input.title, "title");
  const title = required(input.title, "title");
  const rationale = required(input.rationale, "rationale");
  const whyNow = required(input.whyNow, "whyNow");
  const direction = required(input.developmentDirection, "developmentDirection");
  const angle = clean(input.proposedAngle) ?? direction;
  const audience = clean(input.targetAudience);
  const objective = clean(input.objective);
  const format = normalizeFormat(input.recommendedFormat);
  const cta = objective ? `Invite the audience to ${objective.toLowerCase()}.` : "Invite the audience to respond or take the next relevant step.";

  if (format === "image") {
    return {
      version: 1,
      format,
      hook,
      copyPreview: rationale,
      visualDirection: angle,
      cta,
      image: {
        headline: title,
        ...(hook !== title ? { overlayText: hook } : {}),
        ...(audience ? { subheadline: `For ${audience}` } : {}),
        visualSubject: angle,
        composition: "One clear focal subject with generous negative space for the headline.",
        visualStyle: "Brand-led editorial social graphic using existing Brand Brain styling and owned assets when available.",
        cta,
      },
    };
  }

  if (format === "carousel") {
    return {
      version: 1,
      format,
      hook,
      copyPreview: rationale,
      visualDirection: angle,
      cta,
      carousel: {
        cover: { headline: hook, body: title, visualDirection: angle },
        slides: [
          { headline: "Why this matters now", body: whyNow },
          { headline: "The useful angle", body: direction },
        ],
        closingSlide: { headline: "What to do next", body: cta },
        cardCount: 4,
        visualStyle: "Consistent Brand-led editorial cards with one idea per slide.",
      },
    };
  }

  if (format === "reel") {
    return {
      version: 1,
      format,
      hook,
      copyPreview: rationale,
      visualDirection: angle,
      cta,
      reel: {
        hook,
        durationSeconds: 20,
        openingFrame: hook,
        scenes: [
          { startSeconds: 0, endSeconds: 3, beat: "Hook", visualDirection: angle, onScreenText: hook },
          { startSeconds: 3, endSeconds: 8, beat: "Why now", visualDirection: whyNow, onScreenText: short(whyNow, 90) },
          { startSeconds: 8, endSeconds: 15, beat: "Useful insight", visualDirection: direction, onScreenText: short(direction, 90) },
          { startSeconds: 15, endSeconds: 20, beat: "CTA", visualDirection: "Return to the Brand-led closing frame.", onScreenText: short(cta, 90) },
        ],
        voiceoverDirection: `Explain ${title.toLowerCase()} in a direct, evidence-led way${audience ? ` for ${audience}` : ""}.`,
        endingCta: cta,
      },
    };
  }

  return {
    version: 1,
    format: "text",
    hook,
    copyPreview: rationale,
    visualDirection: angle,
    cta,
    text: {
      hook,
      opening: whyNow,
      keyPoints: [rationale, direction],
      captionDirection: `Lead with the hook, explain why it matters now, then develop the angle without overstating the evidence.`,
      cta,
      tone: "Use the Brand Brain voice; concise, specific and evidence-led.",
    },
  };
}

export function normalizeFormat(value: string | undefined): ConceptMockupFormatDto {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (/carousel|slides|swipe/.test(normalized)) return "carousel";
  if (/reel|video|short|tiktok/.test(normalized)) return "reel";
  if (/image|photo|graphic|visual|poster/.test(normalized)) return "image";
  return "text";
}

function clean(value: string | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized || undefined;
}

function required(value: string, field: string): string {
  const normalized = clean(value);
  if (!normalized) throw new Error(`Concept mockup requires ${field}`);
  return normalized;
}

function short(value: string, max: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}
