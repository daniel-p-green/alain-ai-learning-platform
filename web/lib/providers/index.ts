export type Message = { role: "system" | "user" | "assistant"; content: string };

export type ExecuteBody = {
  provider: "poe" | "openai-compatible";
  model: string;
  messages: Message[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
};

export interface Provider {
  execute(body: ExecuteBody): Promise<string>;
  stream(body: ExecuteBody, onData: (data: any) => void): Promise<void>;
}

export { poeProvider } from "./poe";
export { openAIProvider } from "./openai";

