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
      // Map ALAIn model names to Poe model names
      const poeModel = this.mapModelName(req.model);

      const completion = await this.client.chat.completions.create({
        model: poeModel,
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
      // Map ALAIn model names to Poe model names
      const poeModel = this.mapModelName(req.model);

      const stream = await this.client.chat.completions.create({
        model: poeModel,
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

  // Model name mapping for ALAIn to Poe
  private mapModelName(alainModel: string): string {
    const modelMap: Record<string, string> = {
      // GPT-OSS models (what you requested)
      'GPT-OSS-20B': 'GPT-OSS-20B',
      'GPT-OSS-120B': 'GPT-OSS-120B',

      // Popular Poe models
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o-mini',
      'claude-3.5-sonnet': 'Claude-3.5-Sonnet',
      'claude-3-haiku': 'Claude-3-Haiku',
      'gemini-1.5-pro': 'Gemini-1.5-Pro',
      'gemini-1.5-flash': 'Gemini-1.5-Flash',

      // Default fallback
      'default': 'GPT-4o-mini'
    };

    return modelMap[alainModel.toLowerCase()] || modelMap['default'];
  }
}
