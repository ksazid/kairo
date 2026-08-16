from __future__ import annotations

from contextlib import asynccontextmanager
import logging
import os

from fastapi import FastAPI, Header, HTTPException, Request

from .config import ConfigurationError, RuntimeConfig
from .core import HermesRuntimeError, ProviderError, RuntimeService
from .upstream import HermesAgentExecutor, HermesSecurityError


logger = logging.getLogger("kairo.hermes.runtime")
logger.setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        config = RuntimeConfig.from_env()
        executor = HermesAgentExecutor()
    except (ConfigurationError, HermesSecurityError) as error:
        # Failing lifespan prevents the service from becoming ready. Never
        # include environment values or provider exception bodies in logs.
        raise RuntimeError(f"Hermes runtime startup rejected: {type(error).__name__}") from error
    runtime = RuntimeService(config, executor)
    app.state.runtime_service = runtime
    app.state.runtime_version = config.runtime_version
    logger.info(
        "KAIRO_HERMES_RUNTIME_READY primary_provider=%s primary_model=%s primary_pricing=%s fallback_provider=%s fallback_model=%s fallback_pricing=%s",
        config.primary.provider,
        config.primary.model,
        config.primary.pricing_version,
        config.fallback.provider,
        config.fallback.model,
        config.fallback.pricing_version,
    )
    _run_provider_diagnostic(runtime, config)
    yield


app = FastAPI(title="Kairo Hermes Runtime", version="1", lifespan=lifespan)


@app.get("/health/live")
def live() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready")
def ready(request: Request) -> dict[str, str]:
    runtime_version = getattr(request.app.state, "runtime_version", None)
    if not runtime_version:
        raise HTTPException(status_code=503, detail="Hermes runtime is not ready")
    return {"status": "ready", "runtimeVersion": runtime_version}


@app.post("/kairo/v1/invoke")
def invoke(
    payload: dict[str, object],
    request: Request,
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    runtime: RuntimeService = request.app.state.runtime_service
    try:
        return runtime.invoke(payload, authorization=authorization)
    except HermesRuntimeError as error:
        logger.warning(
            "KAIRO_HERMES_RUNTIME_ERROR status=%s detail=%s",
            error.status_code,
            str(error),
        )
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error
    except ProviderError as error:
        # ProviderError messages are constructed by the Kairo-owned adapter and
        # contain only provider name, HTTP status (when known) and exception
        # class. Never log the provider exception body, request, prompt or key.
        logger.warning(
            "KAIRO_HERMES_PROVIDER_ERROR fallback_eligible=%s error=%s",
            error.fallback_eligible,
            str(error),
        )
        raise HTTPException(status_code=502, detail="Hermes model provider is unavailable") from error
    except HermesSecurityError as error:
        logger.error("KAIRO_HERMES_SECURITY_ERROR type=%s", type(error).__name__)
        raise HTTPException(status_code=503, detail="Hermes zero-tool security invariant failed") from error


def _run_provider_diagnostic(
    runtime: RuntimeService,
    config: RuntimeConfig,
    env: dict[str, str] | None = None,
) -> None:
    values = env if env is not None else os.environ
    if values.get("KAIRO_HERMES_PROVIDER_DIAGNOSTIC_RUN", "").strip() != "1":
        return

    try:
        result = runtime.invoke(
            _provider_diagnostic_payload(),
            authorization=f"Bearer {config.service_token}",
        )
    except HermesRuntimeError as error:
        logger.warning(
            "KAIRO_HERMES_PROVIDER_DIAGNOSTIC_FAILED kind=runtime status=%s detail=%s",
            error.status_code,
            str(error),
        )
    except ProviderError as error:
        logger.warning(
            "KAIRO_HERMES_PROVIDER_DIAGNOSTIC_FAILED kind=provider fallback_eligible=%s error=%s",
            error.fallback_eligible,
            str(error),
        )
    except HermesSecurityError as error:
        logger.error(
            "KAIRO_HERMES_PROVIDER_DIAGNOSTIC_FAILED kind=security type=%s",
            type(error).__name__,
        )
    else:
        metadata = result.get("metadata") if isinstance(result, dict) else None
        safe = metadata if isinstance(metadata, dict) else {}
        logger.warning(
            "KAIRO_HERMES_PROVIDER_DIAGNOSTIC_OK provider=%s model=%s pricing=%s latency_ms=%s cost_usd=%s",
            safe.get("provider", "unknown"),
            safe.get("model", "unknown"),
            safe.get("pricingVersion", "unknown"),
            safe.get("latencyMs", "unknown"),
            safe.get("costUsd", "unknown"),
        )


def _provider_diagnostic_payload() -> dict[str, object]:
    return {
        "role": "judge",
        "scope": {"visibility": "global-public"},
        "approvedContextVersion": "hermes-provider-diagnostic-v1",
        "task": {
            "instruction": "Return exactly one JSON object with ok set to true.",
            "context": {"purpose": "provider-route-diagnostic"},
        },
        "outputSchema": {"name": "HermesProviderDiagnostic", "version": "1"},
        "budget": {
            "maxOutputTokens": 32,
            "maxCostUsd": 0.01,
            "timeoutMs": 10000,
        },
        "enabledTools": [],
        "policyFingerprint": "kairo-hermes-reasoning-only-vs03:d2c6af3aa258c47d64c41a56fe9ff61815334e17",
        "routingMode": "resilient",
    }
