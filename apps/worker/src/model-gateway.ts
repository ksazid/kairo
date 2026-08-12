import type {
  ModelGatewayPort,
  ModelGatewayRequest,
  ModelGatewayResult,
} from "@kairo/agent-contracts";

export class ModelGatewayError extends Error {
  readonly code = "model_gateway_error";
}

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface OpenAICompatibleGatewayOptions {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  fetchImpl?: FetchLike;
}

export class OpenAICompatibleModelGateway implements ModelGatewayPort {
  private readonly fetchImpl: FetchLike;
  private readonly provider: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly apiKey: string;

  constructor(options: OpenAICompatibleGatewayOptions) {
    this.provider = required(options.provider, "provider").toLowerCase();
    this.baseUrl = required(options.baseUrl, "baseUrl").replace(/\/$/, "");
    this.model = required(options.model, "model");
    this.apiKey = required(options.apiKey, "apiKey");
    this.fetchImpl = options.fetchImpl ?? fetch;
    if (!/^https:\/\//.test(this.baseUrl) && !/^http:\/\/127\.0\.0\.1(?::\d+)?$/.test(this.baseUrl) && !/^http:\/\/localhost(?::\d+)?$/.test(this.baseUrl)) {
      throw new ModelGatewayError("Model gateway baseUrl must use HTTPS outside local development");
    }
  }

  async generate<TOutput>(request: ModelGatewayRequest): Promise<ModelGatewayResult<TOutput>> {
    if (request.policy.allowedProviders.length && !request.policy.allowedProviders.includes(this.provider)) {
      throw new ModelGatewayError(`Provider ${this.provider} is not allowed by this invocation policy`);
    }
    const started = performance.now();
    const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: `Return only valid JSON matching Kairo schema ${request.outputSchema.name}@${request.outputSchema.version}.` },
          { role: "user", content: request.input },
        ],
        max_tokens: request.policy.maxOutputTokens,
        response_format: { type: "json_object" },
      }),
    });
    if (!response.ok) throw new ModelGatewayError(`Model provider returned ${response.status}`);
    const payload = await response.json() as {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new ModelGatewayError("Model provider returned no content");
    let output: TOutput;
    try { output = JSON.parse(content) as TOutput; }
    catch { throw new ModelGatewayError("Model provider returned invalid JSON"); }
    return {
      output,
      metadata: {
        provider: this.provider,
        model: payload.model ?? this.model,
        inputTokens: safeInt(payload.usage?.prompt_tokens),
        outputTokens: safeInt(payload.usage?.completion_tokens),
        costUsd: 0,
        latencyMs: Math.max(0, Math.round(performance.now() - started)),
      },
    };
  }
}

export function openAICompatibleGatewayFromEnv(env: NodeJS.ProcessEnv = process.env): OpenAICompatibleModelGateway | null {
  const apiKey = env.KAIRO_LLM_API_KEY?.trim();
  const baseUrl = env.KAIRO_LLM_BASE_URL?.trim();
  const model = env.KAIRO_LLM_MODEL?.trim();
  const provider = env.KAIRO_LLM_PROVIDER?.trim();
  if (!apiKey && !baseUrl && !model && !provider) return null;
  if (!apiKey || !baseUrl || !model || !provider) throw new ModelGatewayError("KAIRO_LLM_PROVIDER, KAIRO_LLM_BASE_URL, KAIRO_LLM_MODEL and KAIRO_LLM_API_KEY must be configured together");
  return new OpenAICompatibleModelGateway({ provider, baseUrl, model, apiKey });
}

function required(value: string, field: string): string { const normalized = value.trim(); if (!normalized) throw new ModelGatewayError(`${field} is required`); return normalized; }
function safeInt(value: unknown): number { return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0; }
