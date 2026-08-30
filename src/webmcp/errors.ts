export class ToolError extends Error {
  code: string;
  messageKey: string;

  constructor(code: string, messageKey: string, message: string) {
    super(message);
    this.code = code;
    this.messageKey = messageKey;
    this.name = 'ToolError';
  }
}

export function invalidDateRangeError(): ToolError {
  return new ToolError(
    'INVALID_DATE_RANGE',
    'error.invalidDateRange',
    'The selected date range is invalid.',
  );
}

export function noDataError(): ToolError {
  return new ToolError('NO_DATA', 'error.noData', 'No dataset is loaded yet.');
}

export function invalidCategoryError(category: string): ToolError {
  return new ToolError(
    'INVALID_CATEGORY',
    'error.unknown',
    `Unknown category id: ${category}`,
  );
}
