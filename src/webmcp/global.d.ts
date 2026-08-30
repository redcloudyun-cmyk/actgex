export {};

declare global {
  interface ModelContextToolAnnotations {
    readOnlyHint?: boolean;
    [key: string]: unknown;
  }

  interface ModelContextToolDefinition {
    name: string;
    title?: string;
    description?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputSchema?: Record<string, any>;
    annotations?: ModelContextToolAnnotations;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute: (args: any) => Promise<unknown>;
  }

  interface ModelContext {
    registerTool: (tool: ModelContextToolDefinition) => unknown;
    unregisterTool?: (name: string) => void;
  }

  interface Document {
    modelContext?: ModelContext;
  }
}
