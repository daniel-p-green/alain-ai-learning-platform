import { defineConfig } from 'vitest/config';

const excludeRuntime = !process.env.ENCORE_RUNTIME_LIB;

export default defineConfig({
  test: {
    // Disable the implicit root project; run only explicit projects
    include: [],
    exclude: ['**/node_modules/**', '**/dist/**', 'web/e2e/**'],
    // Use Vitest projects to avoid deprecated options and separate environments
    projects: [
      // Backend unit tests (Node env)
      defineConfig({
      test: {
        name: 'backend',
        environment: 'node',
        include: ['backend/**/*.test.ts'],
        exclude: [
          ...(excludeRuntime ? ['backend/tutorials/*.test.ts'] : []),
        ],
        setupFiles: ['backend/vitest.setup.ts'],
        env: {
          // Avoid live network calls in HF metadata fetch during unit tests
          OFFLINE_MODE: '1',
        },
        deps: {
          optimizer: {
            ssr: {
              // Ensure Encore is not pre-bundled so our mocks apply first
              exclude: [
                'encore.dev',
                'encore.dev/api',
                'encore.dev/config',
                'encore.dev/service',
                'encore.dev/storage/sqldb',
              ],
            },
          },
        },
      },
      server: {
        deps: {
          // Prevent pre-bundling so mocks take effect first
          external: [
            'encore.dev',
            'encore.dev/api',
            'encore.dev/config',
            'encore.dev/service',
            'encore.dev/storage/sqldb',
          ],
        },
      },
      }),
      // Web unit tests (jsdom env)
      defineConfig({
        test: {
          name: 'web',
          environment: 'jsdom',
          include: ['web/**/__tests__/**/*.test.ts', 'web/**/__tests__/**/*.test.tsx'],
          exclude: ['web/e2e/**'],
          // No special setup required; uses jsdom by default
          deps: {
            optimizer: {
              ssr: { exclude: [] },
            },
          },
        },
      }),
    ],
  },
});
