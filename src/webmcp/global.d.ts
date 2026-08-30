export {};

declare global {
  interface ModelContextToolAnnotations {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
    [key: string]: unknown;
  }

  interface ModelContextToolExecuteOptions {
    signal?: AbortSignal;
  }

  interface ModelContextToolDefinition {
    name: string;
    title?: string;
    description?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputSchema?: Record<string, any>;
    annotations?: ModelContextToolAnnotations;
    execute: (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args: any,
      options?: ModelContextToolExecuteOptions,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => Promise<unknown> | unknown;
  }

  interface ModelContextRegisterToolOptions {
    signal?: AbortSignal;
  }

  interface ModelContext {
    registerTool: (
      tool: ModelContextToolDefinition,
      options?: ModelContextRegisterToolOptions,
    ) => Promise<undefined> | undefined;
    unregisterTool?: (name: string) => void;
  }

  interface Document {
    modelContext?: ModelContext;
  }
}
