import type { CategoryId, Region, Transaction } from './types';
import { calendarMonthRange } from '../lib/dates';

function mulberry32(seed: number) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CategoryProfile {
  merchants: string[];
  weeklyFrequency: number; // random daily-occurrence categories
  amountRange: [number, number];
}

interface FixedCost {
  merchant: string;
  category: CategoryId;
  amount: number;
  dayOfMonth: number;
}

interface RegionProfile {
  currency: string;
  categories: Record<
    Exclude<CategoryId, 'SUBSCRIPTION' | 'UTILITIES' | 'TRAVEL'>,
    CategoryProfile
  >;
  subscriptions: { merchant: string; amount: number; dayOfMonth: number }[];
  utilities: { merchant: string; amount: number; dayOfMonth: number }[];
  /** Stable monthly obligations (rent, loans, insurance) — keeps the dashboard realistic even on day 1 of a month, and never becomes the anomaly story. */
  fixedCosts: FixedCost[];
  travel: { merchants: string[]; amountRange: [number, number] };
  monthlyIncome: number;
  budgets: Partial<Record<CategoryId, number>>;
}

const US_PROFILE: RegionProfile = {
  currency: 'USD',
  categories: {
    DINING: {
      merchants: ['Starbucks', 'Chipotle', 'Shake Shack', 'Local Bistro', 'Sushi Go', 'Blue Bottle Coffee'],
      weeklyFrequency: 3.2,
      amountRange: [8, 45],
    },
    GROCERY: {
      merchants: ['Whole Foods', "Trader Joe's", 'Costco', 'Safeway'],
      weeklyFrequency: 1.8,
      amountRange: [20, 140],
    },
    SHOPPING: {
      merchants: ['Amazon', 'Target', 'Best Buy', 'Nike'],
      weeklyFrequency: 1.0,
      amountRange: [15, 220],
    },
    TRANSPORT: {
      merchants: ['Uber', 'Lyft', 'Shell Gas', 'Metro Transit'],
      weeklyFrequency: 2.5,
      amountRange: [5, 40],
    },
    ENTERTAINMENT: {
      merchants: ['AMC Theatres', 'Steam', 'Ticketmaster'],
      weeklyFrequency: 0.6,
      amountRange: [10, 80],
    },
    HEALTH: {
      merchants: ['CVS Pharmacy', 'Walgreens', "Gold's Gym"],
      weeklyFrequency: 0.4,
      amountRange: [10, 120],
    },
    OTHER: {
      merchants: ['Misc Purchase'],
      weeklyFrequency: 0.3,
      amountRange: [5, 60],
    },
  },
  subscriptions: [
    { merchant: 'Netflix', amount: 15.99, dayOfMonth: 3 },
    { merchant: 'Spotify', amount: 11.99, dayOfMonth: 7 },
    { merchant: 'iCloud+', amount: 2.99, dayOfMonth: 12 },
    { merchant: 'Adobe Creative Cloud', amount: 54.99, dayOfMonth: 18 },
  ],
  utilities: [
    { merchant: 'PG&E', amount: 96, dayOfMonth: 5 },
    { merchant: 'Comcast', amount: 79, dayOfMonth: 9 },
    { merchant: 'T-Mobile', amount: 65, dayOfMonth: 15 },
  ],
  fixedCosts: [
    { merchant: 'Apartment Rent', category: 'OTHER', amount: 1950, dayOfMonth: 1 },
    { merchant: 'Auto Loan', category: 'TRANSPORT', amount: 460, dayOfMonth: 1 },
    { merchant: 'Health Insurance', category: 'HEALTH', amount: 420, dayOfMonth: 1 },
    { merchant: 'Student Loan', category: 'OTHER', amount: 380, dayOfMonth: 1 },
    { merchant: 'Auto Insurance', category: 'OTHER', amount: 190, dayOfMonth: 1 },
  ],
  travel: {
    merchants: ['Delta Air Lines', 'Marriott', 'Airbnb'],
    amountRange: [180, 950],
  },
  monthlyIncome: 5200,
  budgets: {
    DINING: 650,
    GROCERY: 520,
    SHOPPING: 420,
    TRANSPORT: 850,
    ENTERTAINMENT: 220,
    HEALTH: 650,
    SUBSCRIPTION: 120,
    UTILITIES: 300,
  },
};

const KR_PROFILE: RegionProfile = {
  currency: 'KRW',
  categories: {
    DINING: {
      merchants: ['스타벅스', '배달의민족', '맘스터치', '김밥천국', '교촌치킨'],
      weeklyFrequency: 3.2,
      amountRange: [8000, 45000],
    },
    GROCERY: {
      merchants: ['이마트', '마켓컬리', '롯데마트'],
      weeklyFrequency: 1.8,
      amountRange: [15000, 120000],
    },
    SHOPPING: {
      merchants: ['쿠팡', '무신사', '올리브영'],
      weeklyFrequency: 1.0,
      amountRange: [15000, 250000],
    },
    TRANSPORT: {
      merchants: ['카카오T', '티머니', 'SRT'],
      weeklyFrequency: 2.5,
      amountRange: [1500, 30000],
    },
    ENTERTAINMENT: {
      merchants: ['CGV', '야놀자', '인터파크'],
      weeklyFrequency: 0.6,
      amountRange: [10000, 60000],
    },
    HEALTH: {
      merchants: ['온누리약국', '헬스클럽'],
      weeklyFrequency: 0.4,
      amountRange: [10000, 100000],
    },
    OTHER: {
      merchants: ['기타 결제'],
      weeklyFrequency: 0.3,
      amountRange: [5000, 50000],
    },
  },
  subscriptions: [
    { merchant: '넷플릭스', amount: 13900, dayOfMonth: 3 },
    { merchant: '멜론', amount: 10900, dayOfMonth: 7 },
    { merchant: '왓챠', amount: 7900, dayOfMonth: 12 },
  ],
  utilities: [
    { merchant: '한국전력공사', amount: 68000, dayOfMonth: 5 },
    { merchant: 'KT', amount: 55000, dayOfMonth: 9 },
    { merchant: 'SK텔레콤', amount: 62000, dayOfMonth: 15 },
  ],
  fixedCosts: [
    { merchant: '월세', category: 'OTHER', amount: 1600000, dayOfMonth: 1 },
    { merchant: '자동차 할부', category: 'TRANSPORT', amount: 550000, dayOfMonth: 1 },
    { merchant: '건강보험', category: 'HEALTH', amount: 350000, dayOfMonth: 1 },
    { merchant: '학자금 상환', category: 'OTHER', amount: 450000, dayOfMonth: 1 },
    { merchant: '자동차 보험', category: 'OTHER', amount: 220000, dayOfMonth: 1 },
    { merchant: '전세대출 상환', category: 'OTHER', amount: 850000, dayOfMonth: 1 },
  ],
  travel: {
    merchants: ['대한항공', '여기어때', '에어비앤비'],
    amountRange: [150000, 900000],
  },
  monthlyIncome: 6200000,
  budgets: {
    DINING: 750000,
    GROCERY: 550000,
    SHOPPING: 450000,
    TRANSPORT: 900000,
    ENTERTAINMENT: 250000,
    HEALTH: 650000,
    SUBSCRIPTION: 80000,
    UTILITIES: 250000,
  },
};

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function round(amount: number, currency: string): number {
  return currency === 'KRW' ? Math.round(amount / 100) * 100 : Math.round(amount * 100) / 100;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Starting budgets + income for a region's demo persona — seeded so the Agent Mission has an existing budget to recommend against. */
export function getDemoProfile(region: Region): { budgets: Partial<Record<CategoryId, number>>; monthlyIncome: number } {
  const profile = region === 'US' ? US_PROFILE : KR_PROFILE;
  return { budgets: { ...profile.budgets }, monthlyIncome: profile.monthlyIncome };
}

export function generateDemoData(region: Region, referenceDate: Date = new Date()): Transaction[] {
  const profile = region === 'US' ? US_PROFILE : KR_PROFILE;
  const rng = mulberry32(region === 'US' ? 20260901 : 20260902);
  const days = 182;
  const start = new Date(referenceDate);
  start.setDate(start.getDate() - days);

  // General "recently pricier" flavor for dining, matched to the trailing
  // 30-day window flag_unusual_spending compares against.
  const recentCutoff = new Date(referenceDate);
  recentCutoff.setDate(recentCutoff.getDate() - 30);

  // Travel spike month: roughly 3 months ago.
  const travelSpikeStart = new Date(referenceDate);
  travelSpikeStart.setDate(travelSpikeStart.getDate() - 100);
  const travelSpikeEnd = new Date(travelSpikeStart);
  travelSpikeEnd.setDate(travelSpikeEnd.getDate() + 12);

  const transactions: Transaction[] = [];
  let counter = 0;

  for (let dayOffset = 0; dayOffset <= days; dayOffset++) {
    const date = new Date(start);
    date.setDate(date.getDate() + dayOffset);
    const iso = isoDate(date);
    const isRecent = date >= recentCutoff;
    const dayOfMonth = date.getDate();

    (Object.keys(profile.categories) as (keyof RegionProfile['categories'])[]).forEach((cat) => {
      const p = profile.categories[cat];
      let freq = p.weeklyFrequency / 7;
      if (cat === 'DINING' && isRecent) freq *= 1.05; // slightly more frequent dining this month
      if (rng() < freq) {
        const [lo, hi] = p.amountRange;
        let amount = lo + rng() * (hi - lo);
        if (cat === 'DINING' && isRecent) amount *= 1.25; // pricier dining this month, ~30% combined
        transactions.push({
          id: `${region}-${counter++}`,
          date: iso,
          merchant: pick(rng, p.merchants),
          category: cat as CategoryId,
          amount: round(amount, profile.currency),
        });
      }
    });

    for (const fixed of profile.fixedCosts) {
      if (dayOfMonth === fixed.dayOfMonth) {
        transactions.push({
          id: `${region}-${counter++}`,
          date: iso,
          merchant: fixed.merchant,
          category: fixed.category,
          amount: fixed.amount,
        });
      }
    }

    for (const sub of profile.subscriptions) {
      if (dayOfMonth === sub.dayOfMonth) {
        transactions.push({
          id: `${region}-${counter++}`,
          date: iso,
          merchant: sub.merchant,
          category: 'SUBSCRIPTION',
          amount: sub.amount,
        });
      }
    }

    for (const util of profile.utilities) {
      if (dayOfMonth === util.dayOfMonth) {
        const variance = 1 + (rng() - 0.5) * 0.1;
        transactions.push({
          id: `${region}-${counter++}`,
          date: iso,
          merchant: util.merchant,
          category: 'UTILITIES',
          amount: round(util.amount * variance, profile.currency),
        });
      }
    }

    if (date >= travelSpikeStart && date <= travelSpikeEnd && rng() < 0.28) {
      const [lo, hi] = profile.travel.amountRange;
      transactions.push({
        id: `${region}-${counter++}`,
        date: iso,
        merchant: pick(rng, profile.travel.merchants),
        category: 'TRAVEL',
        amount: round(lo + rng() * (hi - lo), profile.currency),
      });
    }
  }

  // Deterministically pin dining's month-over-month increase to a stable,
  // presentable ~29% regardless of transaction-count randomness or which
  // day of the month the app happens to be viewed on.
  const [curMonthStart, curMonthEnd] = calendarMonthRange(0, referenceDate);
  const [prevMonthStart, prevMonthEnd] = calendarMonthRange(1, referenceDate);

  // On early-month demo dates (e.g. the 1st), randomness can otherwise leave
  // zero Dining rows in the new month, making current monthly spend look
  // misleadingly close to zero. Guarantee at least one.
  const hasCurrentDining = transactions.some(
    (t) => t.category === 'DINING' && t.date >= curMonthStart && t.date <= curMonthEnd,
  );
  if (!hasCurrentDining) {
    transactions.push({
      id: `${region}-${counter++}`,
      date: isoDate(referenceDate),
      merchant: region === 'US' ? 'Local Bistro' : '배달의민족',
      category: 'DINING',
      amount: region === 'US' ? 42 : 42000,
    });
  }

  const prevDiningTotal = transactions
    .filter((t) => t.category === 'DINING' && t.date >= prevMonthStart && t.date <= prevMonthEnd)
    .reduce((sum, t) => sum + t.amount, 0);
  const curDiningIndexes = transactions
    .map((_, i) => i)
    .filter((i) => transactions[i].category === 'DINING' && transactions[i].date >= curMonthStart && transactions[i].date <= curMonthEnd);
  const curDiningTotal = curDiningIndexes.reduce((sum, i) => sum + transactions[i].amount, 0);
  if (prevDiningTotal > 0 && curDiningTotal > 0) {
    const scale = (prevDiningTotal * 1.29) / curDiningTotal;
    for (const i of curDiningIndexes) {
      transactions[i] = { ...transactions[i], amount: round(transactions[i].amount * scale, profile.currency) };
    }
  }

  // Duplicate subscription charge anomaly: bill the first subscription twice
  // in the most recent full month to simulate an accidental double charge.
  // (Runs before the flag_unusual_spending guarantee below, so that step
  // also accounts for — and dampens — the ratio spike this creates.)
  const dup = profile.subscriptions[0];
  const dupDate = new Date(referenceDate);
  dupDate.setDate(dup.dayOfMonth + (dupDate.getDate() > dup.dayOfMonth ? 0 : -3));
  transactions.push({
    id: `${region}-${counter++}`,
    date: isoDate(dupDate),
    merchant: dup.merchant,
    category: 'SUBSCRIPTION',
    amount: dup.amount,
  });

  // Keep every category except DINING comfortably under
  // `flag_unusual_spending`'s 1.3x anomaly threshold — including SUBSCRIPTION
  // despite the intentional duplicate charge above, which stays visible as a
  // one-off transaction (query_transactions, the transaction table) without
  // competing for the category-level ranking. Low-volume categories
  // (Entertainment, Health, Other) have so few transactions that random
  // noise can otherwise swing their ratio above dining's by chance, sending
  // the Agent Mission's recommendation down the wrong category. This only
  // ever rescales a category's own trailing-30-day transactions relative to
  // its own baseline — it never touches DINING, so it can't disturb the MoM
  // pin above or the 90-day average `recommend_budget_goal` reads.
  {
    const flagRecentStart = isoDate(new Date(referenceDate.getTime() - 30 * 86400000));
    const flagBaselineStart = isoDate(new Date(referenceDate.getTime() - 120 * 86400000));
    const SAFE_RATIO_CAP = 1.15;

    const presentCategories = [...new Set(transactions.map((t) => t.category))];
    for (const cat of presentCategories) {
      if (cat === 'DINING') continue;

      let recent = 0;
      let baseline = 0;
      for (const t of transactions) {
        if (t.category !== cat) continue;
        if (t.date >= flagRecentStart) recent += t.amount;
        else if (t.date >= flagBaselineStart) baseline += t.amount;
      }
      if (recent <= 0) continue;
      const baselineAvgMonthly = baseline / 3;
      const ratio = baselineAvgMonthly > 0 ? recent / baselineAvgMonthly : Infinity;
      if (ratio <= SAFE_RATIO_CAP) continue;

      const targetRecent = baselineAvgMonthly * SAFE_RATIO_CAP;
      const scale = targetRecent / recent;
      const indexes = transactions
        .map((_, i) => i)
        .filter((i) => transactions[i].category === cat && transactions[i].date >= flagRecentStart);
      for (const i of indexes) {
        transactions[i] = { ...transactions[i], amount: round(transactions[i].amount * scale, profile.currency) };
      }
    }

    // Fallback for early-in-the-month reference dates, where "this calendar
    // month" (what the MoM pin above controls) barely overlaps the trailing
    // 30-day window `flag_unusual_spending` actually reads, leaving dining's
    // own recent total under-boosted. Only engages if dining still isn't
    // clearly the top anomaly after dampening every other category; the
    // target is modest (just clearing the threshold with a small margin,
    // not chasing a competitive ratio) so any knock-on effect on
    // `recommend_budget_goal`'s 90-day average stays proportionate.
    let diningRecent = 0;
    let diningBaseline = 0;
    for (const t of transactions) {
      if (t.category !== 'DINING') continue;
      if (t.date >= flagRecentStart) diningRecent += t.amount;
      else if (t.date >= flagBaselineStart) diningBaseline += t.amount;
    }
    const diningBaselineAvgMonthly = diningBaseline / 3;
    const diningRatio = diningBaselineAvgMonthly > 0 ? diningRecent / diningBaselineAvgMonthly : Infinity;
    const MODEST_TARGET = 1.35;
    if (diningRatio < MODEST_TARGET && diningRecent > 0 && diningBaselineAvgMonthly > 0) {
      // Never rescale dining's *recent* window here, nor any baseline data
      // that falls within "last month" — both feed the MoM pin above
      // (directly, or via prevDiningTotal, which the pin already used as its
      // anchor). Re-touching either after the pin already ran would silently
      // move the pinned ~29% MoM ratio (this bit the project twice already:
      // once via the recent window, turning 29% into 41%). The only lever
      // that can't disturb it is the *older* two-thirds of the baseline —
      // strictly before "last month" starts.
      let safeBaselineTotal = 0;
      const safeBaselineIndexes: number[] = [];
      for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];
        if (t.category === 'DINING' && t.date >= flagBaselineStart && t.date < prevMonthStart) {
          safeBaselineTotal += t.amount;
          safeBaselineIndexes.push(i);
        }
      }
      let lastMonthBaselinePortion = 0; // [prevMonthStart, flagRecentStart) — part of "last month", never touched
      for (const t of transactions) {
        if (t.category === 'DINING' && t.date >= prevMonthStart && t.date < flagRecentStart) {
          lastMonthBaselinePortion += t.amount;
        }
      }
      const maxAllowedSafeTotal = Math.max(0, (3 * diningRecent) / MODEST_TARGET - lastMonthBaselinePortion);
      if (safeBaselineTotal > maxAllowedSafeTotal) {
        const scale = safeBaselineTotal > 0 ? maxAllowedSafeTotal / safeBaselineTotal : 0;
        for (const i of safeBaselineIndexes) {
          transactions[i] = { ...transactions[i], amount: round(transactions[i].amount * scale, profile.currency) };
        }
      }
    }
  }

  transactions.sort((a, b) => a.date.localeCompare(b.date));
  return transactions;
}
