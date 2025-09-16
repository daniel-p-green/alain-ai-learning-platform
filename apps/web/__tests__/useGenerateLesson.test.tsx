import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const canMock = typeof vi?.mock === 'function';

if (!canMock) {
  describe.skip('useGenerateLesson', () => {});
} else {
  vi.mock('../lib/backend', () => ({
    backendUrl: (path: string) => path,
  }));

  vi.mock('../lib/api', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../lib/api')>();
    return {
      ...actual,
      default: {
        ...actual.default,
        parseGenerateResponse: vi.fn(),
        hfModelInfo: vi.fn().mockResolvedValue({ license: null, tags: [], downloads: null }),
      },
    };
  });

  const apiModule = await import('../lib/api');
  const api = apiModule.default;
  const { useGenerateLesson } = await import('../features/generate/hooks/useGenerateLesson');

  const parseGenerateResponseMock = api.parseGenerateResponse as unknown as vi.Mock;
  type HookResult = ReturnType<typeof useGenerateLesson> | null;

  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

  function renderUseGenerateLesson(options: Parameters<typeof useGenerateLesson>[0]) {
    const container = document.createElement('div');
    const root = createRoot(container);
    const result: { current: HookResult } = { current: null };

    function Wrapper(props: Parameters<typeof useGenerateLesson>[0]) {
      result.current = useGenerateLesson(props);
      return null;
    }

    act(() => {
      root.render(<Wrapper {...options} />);
    });

    return {
      result,
      rerender: (props: Parameters<typeof useGenerateLesson>[0]) => {
        act(() => {
          root.render(<Wrapper {...props} />);
        });
      },
      unmount: () => {
        act(() => {
          root.unmount();
        });
        container.remove();
      },
    };
  }

  async function flushEffects(times = 2) {
    for (let i = 0; i < times; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }
  }

  describe('useGenerateLesson', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vi.useFakeTimers();
      fetchMock = vi.fn((input: RequestInfo) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : '';
        if (url.includes('/api/providers/models')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ models: [], labelsByName: {} }),
          } as any);
        }
        if (url.includes('/api/providers')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ providers: [{ name: 'poe' }], defaultProvider: 'poe' }),
          } as any);
        }
        if (url.includes('/api/setup')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ offlineMode: false, teacherProvider: 'poe', openaiBaseUrl: 'https://api.test' }),
          } as any);
        }
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({}),
        } as any);
      });
      global.fetch = fetchMock as unknown as typeof fetch;
      parseGenerateResponseMock.mockReset();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.clearAllMocks();
    });

    it('aligns teacher provider with prompt mode and triggers example flow', async () => {
      const hook = renderUseGenerateLesson({ promptMode: 'poe' });
      await flushEffects();
      const current = hook.result.current!;
      expect(current.teacherProvider).toBe('poe');

      const submitSpy = vi.fn();
      current.formRef.current = { requestSubmit: submitSpy } as any;

      act(() => {
        current.triggerExampleHosted();
      });

      await flushEffects();
      await act(async () => {
        vi.runAllTimers();
      });

      expect(submitSpy).toHaveBeenCalled();
      hook.unmount();
    });
  });
}
