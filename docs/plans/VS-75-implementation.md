# VS-75 implementation plan

1. Define the backward-compatible CarouselProject and semantic slide vocabulary.
2. Validate six narrative structures, stable IDs, Claim lineage and Instagram bounds.
3. Compile projects into the existing CarouselPlan rather than replacing it.
4. Define structured content-development lineage and strict model output contracts.
5. Add a separate content-plan generation seam without changing generic Drafter output.
6. Introduce a provider-neutral carousel rendering engine port.
7. Extend bounded theme inputs and add the 1080×1350 Instagram preset.
8. Produce deterministic layout metrics and quality findings.
9. Test every structure, rule, compatibility boundary and deterministic render invariant.
10. Run independent review, preflight and full runtime verification; open a draft PR.

## Security controls
- Claim-linked copy only; no renderer-generated factual copy.
- No arbitrary URL, font, image, shell or browser execution.
- Bounded text, colors, dimensions, IDs and metadata.
- Provider/reference text remains untrusted and never becomes instructions.
- BearCarousel is a design reference only in this slice; importing code requires a separate license/security decision.
