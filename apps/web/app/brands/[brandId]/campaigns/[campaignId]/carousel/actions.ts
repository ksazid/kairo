"use server";
import { redirect } from "next/navigation";
import {
  approveCarouselRender,
  changeCarouselStyle,
  editCarouselSlide,
  regenerateCarouselSlide,
  replaceCarouselSlideImage,
  reorderCarouselSlides,
} from "../../../../../../src/lib/carousel-review-api";
const page = (b: string, c: string, a: string) =>
  `/brands/${encodeURIComponent(b)}/campaigns/${encodeURIComponent(c)}/carousel/${encodeURIComponent(a)}`;
function failure(error: unknown) {
  return encodeURIComponent(
    error instanceof Error ? error.message : "Unable to update carousel",
  );
}
export async function editSlideAction(
  b: string,
  c: string,
  a: string,
  slideId: string,
  version: number,
  form: FormData,
) {
  try {
    await editCarouselSlide(b, c, a, slideId, {
      expectedAssetVersion: version,
      headline: String(form.get("headline") ?? ""),
      body: String(form.get("body") ?? ""),
    });
  } catch (e) {
    redirect(`${page(b, c, a)}?error=${failure(e)}`);
  }
  redirect(
    `${page(b, c, a)}?notice=${encodeURIComponent("Slide updated and rendered")}`,
  );
}
export async function replaceSlideImageAction(
  b: string,
  c: string,
  a: string,
  slideId: string,
  version: number,
  form: FormData,
) {
  try {
    await replaceCarouselSlideImage(b, c, a, slideId, {
      expectedAssetVersion: version,
      imageAssetId: String(form.get("imageAssetId") ?? "").trim() || null,
    });
  } catch (e) {
    redirect(`${page(b, c, a)}?error=${failure(e)}`);
  }
  redirect(
    `${page(b, c, a)}?notice=${encodeURIComponent("Slide image updated")}`,
  );
}
export async function moveSlideAction(
  b: string,
  c: string,
  a: string,
  version: number,
  ordered: string[],
  slideId: string,
  direction: "up" | "down",
) {
  const index = ordered.indexOf(slideId),
    next = index + (direction === "up" ? -1 : 1);
  if (index < 0 || next < 0 || next >= ordered.length) redirect(page(b, c, a));
  const slideIds = [...ordered];
  [slideIds[index], slideIds[next]] = [slideIds[next]!, slideIds[index]!];
  try {
    await reorderCarouselSlides(b, c, a, {
      expectedAssetVersion: version,
      slideIds,
    });
  } catch (e) {
    redirect(`${page(b, c, a)}?error=${failure(e)}`);
  }
  redirect(
    `${page(b, c, a)}?notice=${encodeURIComponent("Slide order updated")}`,
  );
}
export async function regenerateSlideAction(
  b: string,
  c: string,
  a: string,
  slideId: string,
  version: number,
) {
  try {
    await regenerateCarouselSlide(b, c, a, slideId, {
      expectedAssetVersion: version,
    });
  } catch (e) {
    redirect(`${page(b, c, a)}?error=${failure(e)}`);
  }
  redirect(
    `${page(b, c, a)}?notice=${encodeURIComponent("One slide regenerated")}`,
  );
}
export async function changeStyleAction(
  b: string,
  c: string,
  a: string,
  version: number,
  form: FormData,
) {
  try {
    await changeCarouselStyle(b, c, a, {
      expectedAssetVersion: version,
      templateId: String(form.get("templateId") ?? ""),
      styleId: String(form.get("styleId") ?? ""),
    });
  } catch (e) {
    redirect(`${page(b, c, a)}?error=${failure(e)}`);
  }
  redirect(
    `${page(b, c, a)}?notice=${encodeURIComponent("Carousel style updated")}`,
  );
}
export async function approveCarouselAction(
  b: string,
  c: string,
  a: string,
  version: number,
  renderVersionId: string,
) {
  try {
    await approveCarouselRender(b, c, a, {
      expectedAssetVersion: version,
      renderVersionId,
    });
  } catch (e) {
    redirect(`${page(b, c, a)}?error=${failure(e)}`);
  }
  redirect(
    `${page(b, c, a)}?notice=${encodeURIComponent("Final rendered carousel approved")}`,
  );
}
