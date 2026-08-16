# VS-23 Hermes readiness deadline correction

## Root cause

The approved production evidence attempt on `cb3e3362` failed before any model lane because Render returned immediate HTTP 502 responses while the free Hermes service was cold. The prior readiness guard used six attempts with two-second gaps, so the attempt budget was exhausted in roughly ten seconds even though the guard correctly prevented any model invocation.

## Corrective boundary

- Replace fixed readiness-attempt count with a 180-second wall-clock deadline.
- Poll `/health/ready` every five seconds while the deadline remains.
- Cap each readiness HTTP request at 20 seconds or the remaining readiness deadline, whichever is smaller.
- Keep readiness waiting outside every measured benchmark invocation.
- Preserve the existing 65-second inter-lane pacing, 30-second model invocation timeout, 2200-token ceiling, $0.03 cost ceiling, model/provider routing, fallback rules, pinned Corey source, exact-route invariant, inputs, output contract, scoring, durable run claim and fail-closed behavior.
- Readiness probes remain unauthenticated health checks and carry no Hermes service token.

## Regression evidence required

- A cold Hermes simulation must survive more than six initial 502 responses and succeed if readiness becomes healthy inside the deadline.
- A permanently unavailable Hermes simulation must consume the bounded readiness deadline and fail before any model execution.
- Existing eight-lane pacing and route-invariant tests must remain unchanged and green.

## Production control

This correction does not itself authorize merge, production deployment, or another benchmark run. Certification and production approval remain exact-SHA gates under repository governance. Any future benchmark attempt must use a fresh durable run ID and must return `KAIRO_MARKETING_SHADOW_EVIDENCE_RUN` to `0` immediately after completion or failure.
