import sys
import types

import pytest

from hermes_runtime.config import ProviderConfig
from hermes_runtime.upstream import HermesAgentExecutor, HermesSecurityError, assert_zero_tool_profile


def provider():
    return ProviderConfig(
        provider="groq",
        base_url="https://api.groq.com/openai/v1",
        model="openai/gpt-oss-120b",
        api_key="provider-secret",
        input_usd_per_million_tokens=0,
        output_usd_per_million_tokens=0,
        pricing_version="groq-free-test",
    )


def install_model_tools(monkeypatch, tools):
    module = types.ModuleType("model_tools")
    module.get_tool_definitions = lambda **_kwargs: list(tools)
    monkeypatch.setitem(sys.modules, "model_tools", module)


def test_startup_guard_accepts_only_an_exact_empty_tool_surface(monkeypatch):
    install_model_tools(monkeypatch, [])
    assert_zero_tool_profile()

    install_model_tools(monkeypatch, [{"type": "function", "function": {"name": "terminal"}}])
    with pytest.raises(HermesSecurityError, match="zero-tool"):
        assert_zero_tool_profile()


def test_executor_instantiates_one_memoryless_tooled_off_hermes_turn(monkeypatch):
    install_model_tools(monkeypatch, [])
    captured = {}

    class FakeAgent:
        def __init__(self, **kwargs):
            captured.update(kwargs)
            self.tools = []
            self.valid_tool_names = set()
            self._memory_store = None
            self._memory_manager = None
            self.model = kwargs["model"]
            self.session_input_tokens = 321
            self.session_output_tokens = 123
            self._persist_disabled = False

        def run_conversation(self, *, user_message, task_id):
            captured["user_message"] = user_message
            captured["task_id"] = task_id
            captured["persist_disabled_at_run"] = self._persist_disabled
            return {"final_response": '{"ok":true}'}

        def close(self):
            captured["closed"] = True

    run_agent = types.ModuleType("run_agent")
    run_agent.AIAgent = FakeAgent
    monkeypatch.setitem(sys.modules, "run_agent", run_agent)

    result = HermesAgentExecutor().execute(
        provider(),
        system_prompt="system",
        user_prompt='{"instruction":"bounded"}',
        max_output_tokens=900,
        timeout_ms=5000,
    )

    assert captured["provider"] == "groq"
    assert captured["base_url"] == "https://api.groq.com/openai/v1"
    assert captured["api_key"] == "provider-secret"
    assert captured["model"] == "openai/gpt-oss-120b"
    assert captured["api_mode"] == "chat_completions"
    assert captured["max_iterations"] == 1
    assert captured["enabled_toolsets"] == []
    assert captured["save_trajectories"] is False
    assert captured["quiet_mode"] is True
    assert captured["skip_context_files"] is True
    assert captured["skip_memory"] is True
    assert captured["checkpoints_enabled"] is False
    assert captured["request_overrides"] == {"response_format": {"type": "json_object"}}
    assert captured["persist_disabled_at_run"] is True
    assert captured["closed"] is True
    assert result.output_text == '{"ok":true}'
    assert result.input_tokens == 321
    assert result.output_tokens == 123


def test_executor_rejects_tools_or_memory_even_if_upstream_resolver_regresses(monkeypatch):
    install_model_tools(monkeypatch, [])

    class ToolAgent:
        def __init__(self, **_kwargs):
            self.tools = [{"type": "function", "function": {"name": "terminal"}}]
            self.valid_tool_names = {"terminal"}
            self._memory_store = None
            self._memory_manager = None

        def close(self):
            pass

    run_agent = types.ModuleType("run_agent")
    run_agent.AIAgent = ToolAgent
    monkeypatch.setitem(sys.modules, "run_agent", run_agent)

    with pytest.raises(HermesSecurityError, match="tool surface"):
        HermesAgentExecutor().execute(
            provider(),
            system_prompt="system",
            user_prompt="{}",
            max_output_tokens=100,
            timeout_ms=1000,
        )
