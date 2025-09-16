import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const runtimeStub = resolve(__dirname, 'test-shims/encore-runtime-stub.ts');
const runtimeModule = 'encore.dev/dist/internal/runtime/napi/napi.cjs';

const runEncoreSuites = process.env.RUN_ENCORE_TESTS === '1';
const encoreExclusivePatterns = [
  'execution/**/*.test.ts',
  'execution/**/*.integration.test.ts',
  'tutorials/**/*.test.ts',
  'progress/**/*.test.ts',
];

export default defineConfig({
  resolve: {
    alias: {
      'encore-runtime-stub': runtimeStub,
      [runtimeModule]: runtimeStub,
    },
  },
  test: {
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      ...(runEncoreSuites ? [] : encoreExclusivePatterns),
    ],
  },
  server: {
    deps: {
      // Prevent pre-bundling of Encore so our mocks take effect first
      external: [
        'encore.dev',
        'encore.dev/api',
        'encore.dev/config',
        'encore.dev/service',
        'encore.dev/storage/sqldb',
      ],
    },
  },
});
