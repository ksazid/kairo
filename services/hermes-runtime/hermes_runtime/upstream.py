from __future__ import annotations

import os
from typing import Any
from uuid import uuid4

from .config import ProviderConfig
from .core import ProviderError, ProviderResult


class HermesSecurityError(RuntimeError):
    pass


def assert_zero_tool_profile() -> None:
    """Fail startup if the pinned Hermes runtime resolves any Kairo-visible tool."""
    _isolate_hermes_environment()
    from model_tools import get_tool_definitions

    tools = get_tool_definitions(enabled_toolsets=[], disabled_toolsets=None, quiet_mode=True)
    if tools:
        names = [tool.get("function", {}).get("name", "unknown") for tool in tools if isinstance(tool, dict)]
        raise HermesSecurityError(f"Hermes zero-tool startup guard failed: {names}")


class HermesAgentExecutor:
    """Runs one bounded, memoryless, tool-less Hermes AIAgent turn per request."""

    def __init__(self) -> None:
        _isolate_hermes_environment()
        assert_zero_tool_profile()

    def execute(
        self,
        provider: ProviderConfig,
        *,
        system_prompt: str,
        user_prompt: str,
        max_output_tokens: int,
        timeout_ms: int,
    ) -> ProviderResult:
        # Provider request timeouts are owned by the pinned Hermes transport.
        # Kairo's bridge independently enforces its outer invocation timeout.
        del timeout_ms
        try:
            from run_agent import AIAgent

            agent = AIAgent(
                provider=provider.provider,
                base_url=provider.base_url,
                api_key=provider.api_key,
                model=provider.model,
                api_mode="chat_completions",
                max_iterations=1,
                enabled_toolsets=[],
                disabled_toolsets=None,
                save_trajectories=False,
                verbose_logging=False,
                quiet_mode=True,
                ephemeral_system_prompt=system_prompt,
                max_tokens=max_output_tokens,
                request_overrides={"response_format": {"type": "json_object"}},
                skip_context_files=True,
                load_soul_identity=False,
                skip_memory=True,
                checkpoints_enabled=False,
                pass_session_id=False,
            )
            # The upstream resolver is checked at process startup and again on
            # every fresh agent because later config/plugin drift must never
            # grant a Kairo invocation tools or memory authority.
            if list(getattr(agent, "tools", []) or []) or set(getattr(agent, "valid_tool_names", set()) or set()):
                raise HermesSecurityError("Hermes instantiated a non-empty tool surface")
            if getattr(agent, "_memory_store", None) is not None or getattr(agent, "_memory_manager", None) is not None:
                raise HermesSecurityError("Hermes instantiated persistent memory for a Kairo invocation")
            # The pinned runtime supports this internal persistence guard. It
            # prevents the ephemeral Kairo turn from entering Hermes' session
            # store while Kairo remains the sole business source of truth.
            agent._persist_disabled = True

            result = agent.run_conversation(
                user_message=user_prompt,
                task_id=f"kairo-{uuid4()}",
            )
            final_response = result.get("final_response") if isinstance(result, dict) else None
            return ProviderResult(
                output_text=final_response if isinstance(final_response, str) else "",
                model=str(getattr(agent, "model", provider.model) or provider.model),
                input_tokens=_usage(agent, "session_input_tokens", "session_prompt_tokens"),
                output_tokens=_usage(agent, "session_output_tokens", "session_completion_tokens"),
            )
        except HermesSecurityError:
            raise
        except Exception as error:
            raise ProviderError(
                _safe_provider_error(provider.provider, error),
                fallback_eligible=_fallback_eligible(error),
            ) from error
        finally:
            candidate = locals().get("agent")
            close = getattr(candidate, "close", None)
            if callable(close):
                try:
                    close()
                except Exception:
                    pass


def _usage(agent: Any, *names: str) -> int | None:
    for name in names:
        value = getattr(agent, name, None)
        if isinstance(value, int) and not isinstance(value, bool) and value >= 0:
            return value
    return None


def _fallback_eligible(error: Exception) -> bool:
    status = _status_code(error)
    if status == 429 or (status is not None and 500 <= status <= 599):
        return True
    name = type(error).__name__.lower()
    message = str(error).lower()
    return any(token in name or token in message for token in (
        "timeout", "timed out", "connection", "connecterror", "network", "temporarily unavailable", "rate limit",
    ))


def _status_code(error: object) -> int | None:
    for candidate in (error, getattr(error, "response", None), getattr(error, "cause", None), getattr(error, "__cause__", None)):
        value = getattr(candidate, "status_code", None)
        if isinstance(value, int):
            return value
    return None


def _safe_provider_error(provider: str, error: Exception) -> str:
    status = _status_code(error)
    suffix = f" status={status}" if status is not None else ""
    return f"{provider} model invocation failed{suffix} ({type(error).__name__})"


def _isolate_hermes_environment() -> None:
    # Kairo's service image intentionally has no user/project Hermes config.
    # A dedicated ephemeral HERMES_HOME prevents ambient host state from
    # becoming prompt context, plugins, memory, credentials or tool policy.
    os.environ.setdefault("HERMES_HOME", "/tmp/kairo-hermes")
    os.environ.pop("HERMES_KANBAN_TASK", None)
