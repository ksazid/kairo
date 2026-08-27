import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("approved Home screenshot contract", () => {
  it("uses shell context for Home and removes the rejected page hero", () => {
    const page = read("app/page.tsx");
    expect(page).toContain('<h1 className={styles.srOnly}>Home</h1>');
    expect(page).not.toContain("What needs you, what to create next, and what Kairo is handling.");
    expect(page).not.toContain("The one thing that needs you now.");
    expect(page).not.toContain("Have something in mind?");
    expect(page).not.toContain("<KairoScopePicker");
  });

  it("matches the approved compact attention card", () => {
    const page = read("app/page.tsx");
    const css = read("app/home-vs85.module.css");
    expect(page).toContain("Needs attention");
    expect(page).toContain('KairoIcon name="warning"');
    expect(page).toContain("retryButton");
    expect(page).toContain("attentionChevron");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) 58px 16px");
    expect(css).toContain("height:30px");
  });

  it("locks the approved My idea URL/media/Auto format flow", () => {
    const page = read("app/page.tsx");
    const composer = read("app/my-idea-composer.tsx");
    const css = read("app/home-vs85.module.css");
    expect(page).toContain("My idea");
    expect(page).toContain("Add your idea, link or media. Kairo selects a format automatically and you can change it.");
    expect(composer).toContain('placeholder="What do you want to create?"');
    expect(composer).toContain('KairoIcon name="link"');
    expect(composer).toContain('KairoIcon name="image"');
    expect(composer).toContain('KairoIcon name="video"');
    expect(composer).toContain('KairoIcon name="plus"');
    expect(composer).toContain('["image","carousel","reel","video"]');
    expect(composer).toContain('setMode("auto")');
    expect(composer).toContain('"AI Generate"');
    expect(composer).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(composer).toContain('accept="video/mp4,video/quicktime,video/webm"');
    expect(composer).toContain("openMediaLibrary");
    expect(composer).not.toContain("Recommend format");
    expect(composer).not.toContain("Photo attachments are not connected yet");
    expect(composer).not.toContain("Video attachments are not connected yet");
    expect(composer).not.toContain("Existing media selection is not connected yet");
    expect(css).toContain("grid-template-columns: repeat(4, minmax(0, 1fr))");
    expect(css).toContain("height:38px");
  });

  it("keeps the For you rail and adds direct creation without exposing workflow internals", () => {
    const page = read("app/page.tsx");
    const recommendationAction = read("app/for-you-recommendations-action.tsx");
    const createAction = read("app/for-you-create-action.tsx");
    const bookmarkAction = read("app/for-you-bookmark-action.tsx");
    const css = read("app/home-vs85.module.css");
    expect(page).toContain("For you");
    expect(page).toContain("Smart recommendations based on your brand and goals.");
    expect(page).toContain("ForYouRecommendationsAction");
    expect(page).toContain("ForYouCreateAction");
    expect(page).toContain("ForYouBookmarkAction");
    expect(recommendationAction).toContain("Discover ideas");
    expect(recommendationAction).toContain("Discover more");
    expect(createAction).toContain("AI Generate");
    expect(createAction).not.toContain("Use idea");
    expect(createAction).toContain("AI Generate");
    expect(createAction).toContain('["image", "carousel", "reel", "video"]');
    expect(bookmarkAction).toContain('KairoIcon name="bookmark"');
    expect(bookmarkAction).toContain("styles.bookmarkButton");
    expect(page).toContain("railProgress");
    expect(css).toContain("grid-template-columns: repeat(4, minmax(0, 1fr))");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(css).toContain(':has(input[type="checkbox"]:checked)');
    expect(page).toContain("ForYouSelectCheckbox");
    expect(css).toContain("height:88px");
  });

  it("keeps all four What’s working cards in one mobile row", () => {
    const page = read("app/page.tsx");
    const css = read("app/home-vs85.module.css");
    expect(page).toContain("What&apos;s working");
    expect(page).toContain("A quick pulse of your content performance.");
    expect(page).toContain("Last 7 days");
    for (const metric of ["Reach", "Saves", "Shares", "Engagement rate"]) expect(page).toContain(metric);
    expect(css).toContain("grid-template-columns: repeat(4, minmax(0, 1fr))");
    expect(css).not.toContain("@media (max-width: 430px)");
  });

  it("removes legacy Home workflow and duplicate sections", () => {
    const page = read("app/page.tsx");
    for (const forbidden of ["Research", "Hunter", "Angles", "Critic", "Claims", "Truth Gate", "Up Next"]) expect(page).not.toContain(forbidden);
    expect(page).not.toContain("buildUpNext");
  });
});
