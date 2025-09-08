// Alternative Poe integration using OpenAI SDK for Node.js
import OpenAI from 'openai';
import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

interface ExecuteRequest {
  provider: "poe" | "openai-compatible";
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

const poeApiKey = secret("POE_API_KEY");

export class PoeNodeJSProvider {
  private client: OpenAI;

  constructor() {
    const apiKey = poeApiKey();
    if (!apiKey) {
      throw APIError.failedPrecondition("POE_API_KEY not configured");
    }

    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.poe.com/v1', // Poe's OpenAI-compatible endpoint
    });
  }

  async execute(req: ExecuteRequest): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature,
        top_p: req.top_p,
        max_tokens: req.max_tokens,
        stream: false,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      throw new Error(`Poe API error: ${error.message}`);
    }
  }

  async *executeStream(req: ExecuteRequest): AsyncGenerator<string> {
    try {
      const stream = await this.client.chat.completions.create({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature,
        top_p: req.top_p,
        max_tokens: req.max_tokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error: any) {
      throw new Error(`Poe API streaming error: ${error.message}`);
    }
  }
}
