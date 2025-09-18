export interface ToolDescriptor {
    namespace: string;
    name: string;
    description: string;
    schemaExample?: Record<string, unknown>;
}
export interface ToolInvocation {
    timestamp: string;
    sessionId: string;
    tool: string;
    payload: unknown;
    outcome?: {
        status: 'ok' | 'error';
        details?: Record<string, unknown>;
    };
}
interface SessionMetadata {
    modelReference: string;
    difficulty: string;
}
/**
 * Minimal Harmony-style runtime that registers tool definitions and logs invocations.
 * This implementation does not talk to an LLM; it simply records the calls that the
 * legacy prompt-based pipeline would translate into tool usage. The intent is to
 * unblock staged adoption by wiring the existing flow through a consistent API.
 */
export declare class HarmonyStubRuntime {
    private tools;
    private invocations;
    private sessionIdCounter;
    private activeSession;
    private readonly logDir?;
    constructor();
    registerTool(descriptor: ToolDescriptor): void;
    startSession(metadata: SessionMetadata): string;
    logInvocation(tool: string, payload: unknown): void;
    completeInvocation(tool: string, status: 'ok' | 'error', details?: Record<string, unknown>): void;
    endSession(): void;
    private ensureSession;
    private debug;
}
export {};
//# sourceMappingURL=tool-runtime.d.ts.map