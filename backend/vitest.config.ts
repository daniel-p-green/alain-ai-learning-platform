import { defineConfig } from 'vitest/config';

const excludeRuntime = !process.env.ENCORE_RUNTIME_LIB;

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      ...(excludeRuntime ? ['tutorials/*.test.ts'] : []),
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
