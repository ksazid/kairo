# Kairo UI v2 — Home design QA

Reference: approved Kairo Home mockup supplied by the Product Owner.

## Structural comparison

| Section | Result |
| --- | --- |
| Independent dark shell and dedicated design tokens | Passed |
| Sidebar logo, navigation, active state and pro tip | Passed |
| Brand selector, readiness, notification and account controls | Passed |
| Page heading and four format controls | Passed |
| Viral-link input and Analyse link | Passed |
| Three-column Kairo recommendation card | Passed |
| Mockup image, badges, rationale, trend, actions and source | Passed |
| Continue Working panel | Passed |
| What Kairo Learned panel | Passed |
| Discover More image rail | Passed |
| Desktop/tablet/mobile responsive rules | Passed by code inspection |

## Automated checks

- TypeScript: passed
- Next.js production build: passed
- Local server: passed
- Cloud capture: blocked because the cloud browser could not connect to the local preview host

## Remaining visual verification

Capture the deployed Vercel URL at desktop and mobile widths and compare spacing, cropping, and typography against the approved mockup.

final result: blocked
