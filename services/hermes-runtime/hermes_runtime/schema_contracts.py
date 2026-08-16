from __future__ import annotations


_MARKETING_CAROUSEL_V1 = (
    "Required output contract for marketing-carousel-plan@1: return one JSON object with exactly these top-level fields: "
    '"format":"carousel"; "coverHook" as a non-empty string up to 300 characters; '
    '"slides" as an array of 3 to 20 objects, each containing exactly "headline" as a non-empty string up to 240 characters, '
    '"body" as a non-empty string up to 2000 characters, and "supportingClaimIds" as a non-empty array of supplied Claim ids; '
    '"caption" as a non-empty string up to 5000 characters; "cta" as a non-empty string up to 500 characters; '
    'and top-level "supportingClaimIds" as a non-empty array of supplied Claim ids. '
    "The top-level supportingClaimIds must include every requiredClaimId from benchmarkCase, and every slide supportingClaimIds array "
    "must be a subset of the top-level supportingClaimIds. Do not add markdown fences, commentary, or fields outside this contract."
)


_CONTRACTS = {
    "marketing-carousel-plan@1": _MARKETING_CAROUSEL_V1,
}


def schema_contract(name: str, version: str) -> str | None:
    return _CONTRACTS.get(f"{name}@{version}")
