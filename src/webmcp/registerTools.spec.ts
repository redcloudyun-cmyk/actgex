import { afterEach, describe, expect, it, vi } from 'vitest';

describe('registerWebMcpTools', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('awaits all 8 tool registrations and resolves true on success', async () => {
    const registerTool = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('document', { modelContext: { registerTool } });

    const { registerWebMcpTools } = await import('./registerTools');
    const result = await registerWebMcpTools();

    expect(result).toBe(true);
    expect(registerTool).toHaveBeenCalledTimes(8);
  });

  it('resolves false (never true) when a registration rejects', async () => {
    const registerTool = vi
      .fn()
      .mockRejectedValueOnce(new Error('duplicate tool name'))
      .mockResolvedValue(undefined);
    vi.stubGlobal('document', { modelContext: { registerTool } });

    const { registerWebMcpTools } = await import('./registerTools');
    const result = await registerWebMcpTools();

    expect(result).toBe(false);
    // Every tool is still attempted — one bad registration doesn't stop the rest.
    expect(registerTool).toHaveBeenCalledTimes(8);
  });

  it('resolves false immediately when document.modelContext is unavailable', async () => {
    vi.stubGlobal('document', {});
    const { registerWebMcpTools } = await import('./registerTools');
    await expect(registerWebMcpTools()).resolves.toBe(false);
  });

  it('is idempotent: concurrent callers share one in-flight registration', async () => {
    const registerTool = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('document', { modelContext: { registerTool } });

    const { registerWebMcpTools } = await import('./registerTools');
    const [a, b] = await Promise.all([registerWebMcpTools(), registerWebMcpTools()]);

    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(registerTool).toHaveBeenCalledTimes(8);
  });
});
