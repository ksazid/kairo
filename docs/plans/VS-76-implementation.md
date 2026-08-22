# VS-76 implementation plan

1. Define the independent connection-plan and destination-deduplication rules.
2. Extend channel and account contracts additively for provider and authentication method.
3. Add the accessible onboarding choices and Brand-first continuation state.
4. Implement direct Instagram Login with signed, single-use Brand-scoped state.
5. Generalize secure credential persistence and connection health.
6. Relabel and retain Facebook+Instagram Page-linked discovery.
7. Add Facebook-only Page discovery and connection.
8. Add the bounded Facebook publisher and provider-aware Instagram routing.
9. Present independent sources and health in Brand Brain.
10. Verify combinations, migrations, security boundaries, accessibility and runtime regression coverage; open a draft PR.

## Security controls
- OAuth state is signed, time-bounded, Brand- and tenant-scoped, and replay-resistant.
- Provider tokens remain server-side and encrypted using the existing credential boundary.
- Reconnect rotates credentials and revokes or supersedes the prior credential without duplicating destinations.
- Direct Instagram access does not fabricate Page identifiers.
- Provider errors and logs redact tokens, authorization codes and callback secrets.
- Publishing capabilities fail closed for unsupported channel/media combinations.
