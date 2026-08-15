# VS-15 Red Test Matrix

## Domain
- explicit `reel` content type / `publish-reel` capability
- image = exactly one image
- reel = exactly one video
- carousel = 2–10 images
- invalid count/kind combinations rejected
- options are bounded and cannot carry arbitrary secret-shaped values

## Persistence
- Publish Command round-trips media items and options
- due worker job receives exact persisted media items/options
- no credential value is duplicated into persisted media/options

## Provider
- existing single image create → publish remains compatible
- Reel create → IN_PROGRESS → FINISHED → publish
- Reel ERROR fails safely with correlation ID
- Reel readiness polling is bounded
- image carousel creates every child with `is_carousel_item=true`
- carousel parent uses child IDs and `media_type=CAROUSEL`
- any child failure prevents parent creation
- unsafe/private URL fails closed before provider request
- 429/5xx preserve bounded retry metadata
- network uncertainty does not claim success
