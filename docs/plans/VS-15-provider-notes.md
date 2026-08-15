# VS-15 Meta Provider Notes

Primary provider reference: Meta-owned Instagram API collection in the Postman API Network, reviewed 2026-08-15.

## Facebook Login Reel flow

- Create: `POST https://graph.facebook.com/{api_version}/{ig_user_id}/media`
- `media_type=REELS`
- `video_url=<public URL>`
- `caption=<caption>`
- optional `share_to_feed=true|false`
- Status: `GET /{container_id}?fields=status_code,status`
- Publish only when `status_code=FINISHED`
- Finalize: `POST /{ig_user_id}/media_publish` with `creation_id`

## Carousel flow

Meta's current publish-content collection documents child media containers with `is_carousel_item=true`, then a parent `media_type=CAROUSEL` container with `children`, followed by publication of the parent.

VS-15 deliberately limits carousel children to images. This avoids silently assuming the additional asynchronous video-child semantics inside the same slice.

## Safety interpretation

Kairo validates public HTTPS URLs before outbound provider requests, preserves provider correlation IDs, bounds readiness polling, and never converts an uncertain publish response into success.
