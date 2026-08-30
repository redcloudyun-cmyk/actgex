import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../store/useAppStore';
import { setBudgetGoal, simulateBudgetChange } from './tools';
import { ToolError } from './errors';

function loadFakeDataset() {
  useAppStore.setState({
    region: 'US',
    currency: 'USD',
    transactions: [],
    dbReady: true,
    datasetLoaded: true,
    filters: { category: 'ALL', startDate: null, endDate: null, search: '' },
    budgets: {},
    activity: [],
    pendingApproval: null,
  });
}

beforeEach(() => {
  loadFakeDataset();
});

describe('simulateBudgetChange validation', () => {
  it.each([0, -5, 101, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects reductionPercent=%s before touching the dataset',
    async (reductionPercent) => {
      await expect(
        simulateBudgetChange({ category: 'DINING', reductionPercent, months: 4 }),
      ).rejects.toMatchObject({ code: 'INVALID_REDUCTION_PERCENT' } satisfies Partial<ToolError>);
    },
  );

  it.each([0, -1, 1.5, 61])('rejects months=%s before touching the dataset', async (months) => {
    await expect(
      simulateBudgetChange({ category: 'DINING', reductionPercent: 20, months }),
    ).rejects.toMatchObject({ code: 'INVALID_MONTH_COUNT' } satisfies Partial<ToolError>);
  });

  it('accepts a valid request shape (still requires a real dataset to resolve)', async () => {
    // Validation passes; it then throws NO_DATA because there is no
    // DuckDB-Wasm instance in this Node test environment — proves
    // validation runs strictly before any dataset/DB access.
    useAppStore.setState({ datasetLoaded: false });
    await expect(simulateBudgetChange({ category: 'DINING', reductionPercent: 20, months: 4 })).rejects.toMatchObject(
      { code: 'NO_DATA' } satisfies Partial<ToolError>,
    );
  });
});

describe('setBudgetGoal validation', () => {
  it.each([0, -100, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects monthlyLimit=%s',
    async (monthlyLimit) => {
      await expect(setBudgetGoal({ category: 'DINING', monthlyLimit }, 'test-activity')).rejects.toMatchObject({
        code: 'INVALID_BUDGET_LIMIT',
      } satisfies Partial<ToolError>);
    },
  );
});

describe('setBudgetGoal approval flow', () => {
  it('applies the budget only after the human approves', async () => {
    const resultPromise = setBudgetGoal({ category: 'DINING', monthlyLimit: 400 }, 'evt-approve');

    // Give the tool a tick to reach WAITING_APPROVAL and register its resolver.
    await Promise.resolve();
    expect(useAppStore.getState().pendingApproval?.activityId).toBe('evt-approve');

    useAppStore.getState().respondToApproval(true);
    const result = await resultPromise;

    expect(result.applied).toBe(true);
    expect(useAppStore.getState().budgets.DINING).toBe(400);
  });

  it('leaves the budget untouched when the human rejects', async () => {
    const resultPromise = setBudgetGoal({ category: 'DINING', monthlyLimit: 400 }, 'evt-reject');
    await Promise.resolve();

    useAppStore.getState().respondToApproval(false);
    const result = await resultPromise;

    expect(result.applied).toBe(false);
    expect(useAppStore.getState().budgets.DINING).toBeUndefined();
  });
});
