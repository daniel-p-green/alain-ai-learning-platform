import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { __test__ } from '../useOnboarding';

describe('useOnboarding helpers', () => {
  const storage = (() => {
    let data = new Map<string, string>();
    return {
      getItem(key: string) {
        return data.has(key) ? data.get(key)! : null;
      },
      setItem(key: string, value: string) {
        data.set(key, String(value));
      },
      removeItem(key: string) {
        data.delete(key);
      },
      clear() {
        data.clear();
      },
      key(index: number) {
        return Array.from(data.keys())[index] ?? null;
      },
      get length() {
        return data.size;
      },
    } satisfies Storage;
  })();

  const originalStorage = (globalThis as any).localStorage;
  const originalWindow = (globalThis as any).window;

  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage,
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { localStorage: storage },
    });
  });

  afterAll(() => {
    if (originalStorage === undefined) {
      delete (globalThis as any).localStorage;
    } else {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: originalStorage,
      });
    }
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      });
    }
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it('reset toggles completed to false', () => {
    __test__.writeOnboarding({ version: '1', completed: true });
    expect(__test__.readOnboarding().completed).toBe(true);
    __test__.writeOnboarding({ completed: false });
    expect(__test__.readOnboarding().completed).toBe(false);
  });
});
