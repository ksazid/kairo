from hermes_runtime.schema_contracts import schema_contract


def test_marketing_carousel_contract_exposes_exact_kairo_shape_and_lineage_rules():
    contract = schema_contract("marketing-carousel-plan", "1")

    assert contract is not None
    assert '"format":"carousel"' in contract
    assert '"coverHook"' in contract
    assert '"slides"' in contract
    assert '"headline"' in contract
    assert '"body"' in contract
    assert '"caption"' in contract
    assert '"cta"' in contract
    assert '"supportingClaimIds"' in contract
    assert "3 to 20" in contract
    assert "every requiredClaimId" in contract
    assert "subset of the top-level supportingClaimIds" in contract


def test_unknown_schema_does_not_receive_an_invented_contract():
    assert schema_contract("strategist-angles", "1") is None
