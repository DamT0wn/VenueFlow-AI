import { describe, expect, it } from 'vitest';
import { queryClient } from '../../lib/queryClient';

describe('queryClient config', () => {
  it('has expected query defaults', () => {
    const opts = queryClient.getDefaultOptions();

    expect(opts.queries?.staleTime).toBe(60_000);
    expect(opts.queries?.gcTime).toBe(180_000);
    expect(opts.queries?.retry).toBe(1);
    expect(opts.queries?.refetchOnWindowFocus).toBe(false);
    expect(opts.queries?.refetchOnReconnect).toBe(true);
  });

  it('has expected mutation defaults', () => {
    const opts = queryClient.getDefaultOptions();
    expect(opts.mutations?.retry).toBe(0);
  });
});
