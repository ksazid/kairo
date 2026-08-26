# VS-102 Implementation Plan

1. Extend agent contracts with bounded media-analysis evidence/output types.
2. Add MediaAnalyzer orchestration in the API with explicit optional ports for speech-to-text, frame extraction and OCR.
3. Prefer already-normalized captions/transcripts; only invoke optional media ports when useful evidence is missing.
4. Produce bounded structured evidence: thesis, hooks, claims/facts, entities, format, presenter, CTA, audience and visual cues with confidence/warnings/provenance.
5. Add bounded onboarding sampling primitives: initial reference, profile/site context, recent items <=20, deep items <=5, About/Product; canonicalize and dedupe.
6. Reuse SourceRouter and MediaAnalyzer from onboarding and My Idea paths; no duplicate retrieval implementation.
7. Add deterministic tests for capability fallback, no-fabrication, limits, provenance and deduplication.
8. Run focused tests, repository tests/typecheck/build, governance validation and preflight before certification.
