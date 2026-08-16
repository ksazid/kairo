from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException, Request

from .config import ConfigurationError, RuntimeConfig
from .core import HermesRuntimeError, ProviderError, RuntimeService
from .upstream import HermesAgentExecutor, HermesSecurityError


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        config = RuntimeConfig.from_env()
        executor = HermesAgentExecutor()
    except (ConfigurationError, HermesSecurityError) as error:
        # Failing lifespan prevents the service from becoming ready. Never
        # include environment values or provider exception bodies in logs.
        raise RuntimeError(f"Hermes runtime startup rejected: {type(error).__name__}") from error
    app.state.runtime_service = RuntimeService(config, executor)
    app.state.runtime_version = config.runtime_version
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
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error
    except ProviderError as error:
        raise HTTPException(status_code=502, detail="Hermes model provider is unavailable") from error
    except HermesSecurityError as error:
        raise HTTPException(status_code=503, detail="Hermes zero-tool security invariant failed") from error
