import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
/**
 * Minimal Harmony-style runtime that registers tool definitions and logs invocations.
 * This implementation does not talk to an LLM; it simply records the calls that the
 * legacy prompt-based pipeline would translate into tool usage. The intent is to
 * unblock staged adoption by wiring the existing flow through a consistent API.
 */
export class HarmonyStubRuntime {
    constructor() {
        this.tools = [];
        this.invocations = [];
        this.sessionIdCounter = 0;
        this.activeSession = null;
        const logRoot = process.env.ALAIN_TOOL_RUNTIME_LOGDIR;
        if (logRoot) {
            try {
                mkdirSync(logRoot, { recursive: true });
            }
            catch { }
            this.logDir = logRoot;
        }
    }
    registerTool(descriptor) {
        const toolKey = `${descriptor.namespace}.${descriptor.name}`;
        if (!this.tools.find(t => `${t.namespace}.${t.name}` === toolKey)) {
            this.tools.push(descriptor);
            this.debug(`Registered tool ${toolKey}`);
        }
    }
    startSession(metadata) {
        this.sessionIdCounter += 1;
        const id = `session-${this.sessionIdCounter}`;
        this.activeSession = { id, metadata };
        this.debug(`Started Harmony stub session ${id}`);
        return id;
    }
    logInvocation(tool, payload) {
        const sessionId = this.ensureSession();
        const record = {
            timestamp: new Date().toISOString(),
            sessionId,
            tool,
            payload
        };
        this.invocations.push(record);
        this.debug(`Invoke ${tool}`, payload);
    }
    completeInvocation(tool, status, details) {
        const sessionId = this.ensureSession();
        const recordIndex = [...this.invocations].reverse().findIndex(entry => entry.sessionId === sessionId && entry.tool === tool && !entry.outcome);
        if (recordIndex === -1) {
            this.debug(`No pending invocation found for ${tool} in ${sessionId}`);
            return;
        }
        const absoluteIndex = this.invocations.length - 1 - recordIndex;
        this.invocations[absoluteIndex].outcome = { status, details };
        this.debug(`Complete ${tool} with status=${status}`, details);
    }
    endSession() {
        if (!this.activeSession)
            return;
        const { id } = this.activeSession;
        this.debug(`Ending Harmony stub session ${id}`);
        if (this.logDir) {
            const file = path.join(this.logDir, `${id}.json`);
            const payload = {
                session: this.activeSession,
                tools: this.tools,
                invocations: this.invocations.filter(entry => entry.sessionId === id)
            };
            try {
                writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
            }
            catch { }
        }
        this.activeSession = null;
    }
    ensureSession() {
        if (!this.activeSession) {
            throw new Error('HarmonyStubRuntime session not started');
        }
        return this.activeSession.id;
    }
    debug(message, payload) {
        if (process.env.ALAIN_TOOL_RUNTIME_DEBUG !== '1')
            return;
        if (payload) {
            console.debug(`[HarmonyStub] ${message}`, payload);
        }
        else {
            console.debug(`[HarmonyStub] ${message}`);
        }
    }
}
//# sourceMappingURL=tool-runtime.js.map