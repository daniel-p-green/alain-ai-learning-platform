export type Message = { role: "system" | "user" | "assistant"; content: string };

export interface ExecuteRequest {
  provider: "poe" | "openai-compatible";
  model: string;
  messages: Message[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

export interface Provider {
  execute(body: ExecuteRequest): Promise<string>;
  stream(body: ExecuteRequest, onData: (data: any) => void, signal?: AbortSignal): Promise<void>;
}

export { poeProvider } from "./poe";
export { openAIProvider } from "./openai";

