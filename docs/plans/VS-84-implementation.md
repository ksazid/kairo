# VS-84 implementation plan

1. Preserve the existing Brand, Knowledge Source, Brand Brain/shared Brand Memory and channel-adapter contracts; do not create a second onboarding source of truth.
2. Replace the previous provider/setup wizard with one public Brand URL for both first-Brand and additional-Brand entry.
3. Normalize the public HTTP(S) URL and derive a provisional Brand name from the host/profile path where possible.
4. Create the Workspace only when needed, create the Brand with the public reference, then invoke the existing Brand Brain bootstrap path.
5. Let the Brand Brain proposal generator infer identity, positioning, audience, voice, content direction, visual direction and provisional goals from evidence. Do not require an onboarding goal selection.
6. Keep inferred `goals.objectives` source-backed and provisional unless explicitly confirmed later; do not surface it as an onboarding question.
7. Show one bounded learning state in the UI. If public-reference learning fails or the generator is unavailable, preserve the created Brand and route to confirmation with a limited-learning notice.
8. Present a concise confirmation summary from the existing Brand Brain fields: What you do, Who you serve, Your style and Main topics. `Looks right` confirms the eligible inferred Brand context and routes to Home.
9. Keep authenticated social-channel connection out of onboarding. A public social URL is evidence only; publishing/private Insights still require the existing capability-checked authenticated connection.
10. Add `Connect a channel` as a plain-language Home Needs Attention item when no suitable authenticated publishing destination exists. Keep connection/recovery detail under Brand after onboarding.
11. Use the approved primary navigation everywhere: Home, Content, Calendar, Results and Brand.
12. Apply UI UX Pro Max for flow/accessibility, Impeccable for bounded polish, Emil Design Engineering principles for purposeful motion, Ponytail for React/Next.js implementation quality, and UI Review as the final design/accessibility/responsive gate. The approved Design Baseline remains authoritative.
13. Keep ordinary motion short and functional: button press feedback, learning progress, subtle onboarding/confirmation entrances, state transitions and optional short staggered reveal. Respect `prefers-reduced-motion`; do not add decorative AI animation.
14. Maintain deterministic tests for URL normalization/name inference, Brand Brain bootstrap without an explicit primary objective, source-backed provisional goal proposals, primary navigation, first/additional Brand routing and tenant/Brand isolation.
15. Run `npm run preflight`, `npm run runtime:verify`, security baseline and the repository CI path. Treat any Vercel/build failure as blocking until resolved or proven unrelated with evidence.
16. Update delivery state/evidence only after the immutable implementation candidate passes. Stop for certification and exact-SHA human approval; do not merge, release or production-enable autonomously.
