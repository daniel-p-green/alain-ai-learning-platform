export type ProviderId = 'poe' | 'openai-compatible';
export interface ProviderCaps {
    id: ProviderId;
    allowResponseFormat: boolean;
    allowTopP: boolean;
}
export declare function detectProvider(baseUrl?: string): ProviderId;
export declare function capsFor(baseUrl?: string): ProviderCaps;
export declare function normalizeProviderBase(baseUrl?: string): string;
export declare function buildChatCompletionsUrl(baseUrl?: string): string;
//# sourceMappingURL=providers.d.ts.map