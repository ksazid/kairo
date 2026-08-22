import { cookies } from "next/headers";
export interface CarouselQualityFinding {
  id: string;
  code: string;
  severity: "error" | "warning" | "advisory";
  message: string;
  slideId?: string;
}
export interface CarouselSlideReview {
  id: string;
  position: number;
  role: string;
  headline: string;
  body: string;
  imageUrl?: string;
  renderedUrl?: string;
  qualityFindings: CarouselQualityFinding[];
}
export interface CarouselChoice {
  id: string;
  label: string;
}
export interface CarouselReview {
  id: string;
  assetId: string;
  assetVersion: number;
  renderVersionId: string;
  status: "draft" | "rendering" | "ready" | "approved" | "failed";
  templateId: string;
  styleId: string;
  templates: CarouselChoice[];
  styles: CarouselChoice[];
  slides: CarouselSlideReview[];
  qualitySummary: { errors: number; warnings: number; advisories: number };
  qualityFindings?: CarouselQualityFinding[];
  approvedAt?: string;
}
export class CarouselReviewApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
function base() {
  return (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(
    /\/$/,
    "",
  );
}
function root(brandId: string, campaignId: string, assetId: string) {
  return `/api/v1/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(campaignId)}/assets/${encodeURIComponent(assetId)}/carousel-review`;
}
async function call(path: string, init?: RequestInit) {
  const token = (await cookies()).get("kairo_access_token")?.value;
  if (!token)
    throw new CarouselReviewApiError("Authentication is required", 401);
  const response = await fetch(`${base()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      authorization: `Bearer ${token}`,
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new CarouselReviewApiError(
      problem?.detail ?? "Carousel review request failed",
      response.status,
    );
  }
  return (await response.json()) as CarouselReview;
}
export function getCarouselReview(b: string, c: string, a: string) {
  return call(root(b, c, a));
}
export function bootstrapCarouselReview(b: string, c: string, a: string) {
  return call(`${root(b, c, a)}/bootstrap`, { method: "POST" });
}
export function renderCarouselReview(
  b: string,
  projectId: string,
  expectedAssetVersion: number,
) {
  return call(
    `/api/v1/brands/${encodeURIComponent(b)}/carousel-projects/${encodeURIComponent(projectId)}/render`,
    {
      method: "POST",
      body: JSON.stringify({ expectedAssetVersion }),
    },
  );
}
export async function ensureCarouselReview(b: string, c: string, a: string) {
  try {
    return await getCarouselReview(b, c, a);
  } catch (error) {
    if (!(error instanceof CarouselReviewApiError) || error.status !== 404)
      throw error;
    const draft = await bootstrapCarouselReview(b, c, a);
    await renderCarouselReview(b, draft.id, draft.assetVersion);
    return getCarouselReview(b, c, a);
  }
}
export function editCarouselSlide(
  b: string,
  c: string,
  a: string,
  slideId: string,
  input: { expectedAssetVersion: number; headline: string; body: string },
) {
  return call(`${root(b, c, a)}/slides/${encodeURIComponent(slideId)}/text`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
export function replaceCarouselSlideImage(
  b: string,
  c: string,
  a: string,
  slideId: string,
  input: { expectedAssetVersion: number; imageAssetId: string | null },
) {
  return call(`${root(b, c, a)}/slides/${encodeURIComponent(slideId)}/image`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
export function reorderCarouselSlides(
  b: string,
  c: string,
  a: string,
  input: { expectedAssetVersion: number; slideIds: string[] },
) {
  return call(`${root(b, c, a)}/slides/reorder`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
export function regenerateCarouselSlide(
  b: string,
  c: string,
  a: string,
  slideId: string,
  input: { expectedAssetVersion: number },
) {
  return call(
    `${root(b, c, a)}/slides/${encodeURIComponent(slideId)}/regenerate`,
    { method: "POST", body: JSON.stringify(input) },
  );
}
export function changeCarouselStyle(
  b: string,
  c: string,
  a: string,
  input: { expectedAssetVersion: number; templateId: string; styleId: string },
) {
  return call(`${root(b, c, a)}/style`, {
    method: "PATCH",
    body: JSON.stringify({
      expectedAssetVersion: input.expectedAssetVersion,
      templateId: input.templateId,
      style: { styleId: input.styleId },
    }),
  });
}
export function approveCarouselRender(
  b: string,
  c: string,
  a: string,
  input: {
    expectedAssetVersion: number;
    renderVersionId: string;
  },
) {
  return call(`${root(b, c, a)}/approve`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
