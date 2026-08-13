# VS-11 topology matrix

DEC-008 remains pending.

| Layer | Leading option | Pilot note |
|---|---|---|
| Web | Vercel | Best fit for the existing Next.js app; choose a plan compatible with pilot use. |
| API | Render Docker, Frankfurt | Kairo has a Docker artifact, health routes, PORT support and 0.0.0.0 binding. |
| Database | Neon Postgres, Frankfurt | Supports Postgres 18 and pgvector with a persistent free pilot option. |

Alternatives remain valid: Render can host both web and API; paid Render Postgres can colocate database and API. Provider selection is not approved by this matrix.
