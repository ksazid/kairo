# VS-11 topology matrix

DEC-008 approved on 2026-08-14 for the bounded non-production pilot.

| Layer | Approved pilot provider | Pilot plan / region | Rationale |
|---|---|---|---|
| Web | Vercel | Hobby | Best fit for the existing Next.js app and preview deployments. Permitted only while the pilot remains non-commercial. |
| API | Render | Free Web Service, Frankfurt | Kairo has a Docker artifact, health routes, PORT support and 0.0.0.0 binding. Cold starts are accepted for the pilot. Render Free is not a production tier. |
| Database | Neon Postgres | Free, AWS Europe (Frankfurt) | Persistent serverless Postgres with scale-to-zero; supports Postgres 18 and pgvector and fits the zero-budget low-traffic pilot. |

Approved topology: **split — Vercel web + Render API + Neon Postgres**.

Release-order contract remains `database/migrations → API → API health check → web → end-to-end smoke`, with every deployed component tied to the exact certified release SHA.

Before commercial use or production enablement, re-evaluate and explicitly approve paid plans/capacity, backups/restore objectives, observability and operating budget. This topology decision does not itself grant production enablement.
