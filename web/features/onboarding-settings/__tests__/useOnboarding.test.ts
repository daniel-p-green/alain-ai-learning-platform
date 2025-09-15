import { describe, it, expect, beforeEach } from 'vitest';
import { __test__ } from '../useOnboarding';

describe('useOnboarding helpers', () => {
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
