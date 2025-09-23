export type PoeModel = {
  id: PoeModelId;
  label: string;
  description: string;
  recommended?: boolean;
};

export const poeModels = [
  {
    id: "gpt-oss-20b",
    label: "GPT-OSS-20B",
    description: "Open-source tuned teacher model optimised for tutorials.",
    recommended: true
  },
  {
    id: "gpt-oss-120b",
    label: "GPT-OSS-120B",
    description: "Larger OSS model with deeper reasoning and longer contexts."
  },
  {
    id: "gpt-5",
    label: "GPT-5",
    description: "Flagship high-reliability runtime for product demos."
  },
  {
    id: "gpt-5-chat",
    label: "GPT-5 Chat",
    description: "Conversational tuning of GPT-5 with faster latency."
  },
  {
    id: "claude-3.5-sonnet",
    label: "Claude 3.5 Sonnet",
    description: "Anthropic balanced model with tool-friendly outputs."
  },
  {
    id: "claude-opus-4.1",
    label: "Claude Opus 4.1",
    description: "High context window for research-heavy exchanges."
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    description: "Google multimodal-capable chat model."
  },
  {
    id: "grok-3",
    label: "Grok 3",
    description: "XAI knowledge-focused assistant with fast follow-ups."
  },
  {
    id: "mixtral-8x22b",
    label: "Mixtral 8x22B",
    description: "Mixture-of-experts OSS alternative with low latency."
  },
  {
    id: "llama-3.1-405b",
    label: "Llama 3.1 405B",
    description: "Meta's flagship mixture-of-experts teacher."
  }
] as const satisfies readonly PoeModel[];

export type PoeModelId = typeof poeModels[number]["id"];

const allowedIds = new Set<PoeModelId>(poeModels.map((model) => model.id));

export function isAllowedModel(model: unknown): model is PoeModelId {
  return typeof model === "string" && allowedIds.has(model as PoeModelId);
}
