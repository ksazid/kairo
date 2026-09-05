# Concept Mockup Slice

Status: implementation complete; certified for merge. Production migration/deployment remains separate.

## Goal

Turn each qualified Hunter opportunity into a cheap, structured concept preview that helps a user understand the idea before Kairo spends money generating final media.

## Boundaries

- Hunter evidence, confidence and opportunity scoring remain authoritative and unchanged.
- Concept mockups are presentation guidance only; they must never increase Hunter scores or evidence confidence.
- Mockup generation is best-effort. A mockup failure must not fail or suppress a valid Hunter opportunity.
- Home and Discover reuse the same persisted mockup.
- Content Preview remains reserved for actual generated content.
- No image-generation API, video-generation API, scheduler or worker is required in this slice.

## Surfaces

1. Home recommendations — compact concept preview.
2. Discover list/grid — card concept preview.
3. Discover Preview — full concept preview with evidence and Create with Kairo handoff.

## Formats

- text — hook, opening, key points, caption direction, CTA and tone.
- image — headline, subheadline, visual subject, composition, overlay text, visual style and CTA.
- carousel — cover, representative slides, closing slide, card count and visual style.
- reel — hook, approximate duration, opening frame, storyboard scenes, on-screen text, voiceover direction and ending CTA.

## Persistence contract

Each opportunity may carry a versioned `conceptMockup` object plus `conceptMockupGeneratedAt`. The object is additive and optional so existing opportunities remain valid.

## Handoff

`Create with Kairo` receives Brand Brain + Hunter opportunity + evidence + concept mockup. The mockup acts as a creative brief; downstream Researcher/Strategist/Drafter/media generation may improve it.

## Certification gates

- Existing Hunter opportunity scoring remains unchanged.
- Opportunity remains available when mockup is absent or invalid.
- Mockups are brand-scoped through the opportunity owner.
- Text/image/carousel/reel payloads validate against the shared contract.
- Home/Discover render a fallback when no mockup exists.
- No production scheduler is enabled by this slice.
