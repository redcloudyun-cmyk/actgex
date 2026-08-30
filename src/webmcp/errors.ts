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

export function invalidDateError(value: string): ToolError {
  return new ToolError('INVALID_DATE', 'error.invalidDate', `Not a valid ISO date: ${value}`);
}

export function noDataError(): ToolError {
  return new ToolError('NO_DATA', 'error.noData', 'No dataset is loaded yet.');
}

export function invalidCategoryError(category: string): ToolError {
  return new ToolError(
    'INVALID_CATEGORY',
    'error.invalidCategory',
    `Unknown category id: ${category}`,
  );
}

export function invalidBudgetLimitError(): ToolError {
  return new ToolError(
    'INVALID_BUDGET_LIMIT',
    'error.invalidBudgetLimit',
    'monthlyLimit must be a finite number greater than 0.',
  );
}

export function invalidReductionPercentError(): ToolError {
  return new ToolError(
    'INVALID_REDUCTION_PERCENT',
    'error.invalidReductionPercent',
    'reductionPercent must be a finite number greater than 0 and at most 100.',
  );
}

export function invalidMonthCountError(): ToolError {
  return new ToolError(
    'INVALID_MONTH_COUNT',
    'error.invalidMonthCount',
    'months must be an integer between 1 and 60.',
  );
}

export interface SerializedToolError {
  message: string;
  code?: string;
  messageKey?: string;
}

export function serializeToolError(err: unknown): SerializedToolError {
  if (err instanceof ToolError) {
    return { message: err.message, code: err.code, messageKey: err.messageKey };
  }
  return { message: err instanceof Error ? err.message : String(err) };
}

export function invalidAmountRangeError(): ToolError {
  return new ToolError(
    'INVALID_AMOUNT_RANGE',
    'error.invalidAmountRange',
    'minAmount and maxAmount must be non-negative, and minAmount must not exceed maxAmount.',
  );
}
