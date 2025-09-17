export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface Logger {
    debug: (msg: string, ctx?: Record<string, any>) => void;
    info: (msg: string, ctx?: Record<string, any>) => void;
    warn: (msg: string, ctx?: Record<string, any>) => void;
    error: (msg: string, ctx?: Record<string, any>) => void;
}
export declare function createLogger(component: string): Logger;
export declare function timeIt<T>(name: string, fn: () => Promise<T> | T, ctx?: Record<string, any>): Promise<T>;
export declare function trackEvent(name: string, props?: Record<string, any>): void;
type Labels = Record<string, string | number | boolean> | undefined;
export declare const metrics: {
    inc(name: string, by?: number, labels?: Labels): void;
    observe(name: string, value: number, labels?: Labels): void;
    snapshot(): {
        counters: Record<string, number>;
        timers: Record<string, {
            count: number;
            avg: number;
            min: number;
            max: number;
            p50: number;
            p95: number;
        }>;
    };
    reset(): void;
};
export {};
//# sourceMappingURL=obs.d.ts.map