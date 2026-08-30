import { describe, expect, it } from 'vitest';
import { digitsOnly, digitsToIso, formatDraft, isoToDisplay } from './localizedDate';

describe('digitsOnly', () => {
  it('strips separators and caps at 8 digits', () => {
    expect(digitsOnly('08/30/2026')).toBe('08302026');
    expect(digitsOnly('2026.08.30')).toBe('20260830');
    expect(digitsOnly('abc123456789')).toBe('12345678');
  });
});

describe('formatDraft', () => {
  it('builds MM/DD/YYYY incrementally for English', () => {
    expect(formatDraft('', false)).toBe('');
    expect(formatDraft('08', false)).toBe('08');
    expect(formatDraft('0830', false)).toBe('08/30');
    expect(formatDraft('08302026', false)).toBe('08/30/2026');
  });

  it('builds YYYY.MM.DD incrementally for Korean', () => {
    expect(formatDraft('', true)).toBe('');
    expect(formatDraft('2026', true)).toBe('2026');
    expect(formatDraft('202608', true)).toBe('2026.08');
    expect(formatDraft('20260830', true)).toBe('2026.08.30');
  });
});

describe('isoToDisplay', () => {
  it('renders MM/DD/YYYY for English (TC-03)', () => {
    expect(isoToDisplay('2026-08-30', false)).toBe('08/30/2026');
  });

  it('renders YYYY.MM.DD for Korean (TC-04)', () => {
    expect(isoToDisplay('2026-08-30', true)).toBe('2026.08.30');
  });
});

describe('digitsToIso', () => {
  it('parses a valid English date (§7.1)', () => {
    expect(digitsToIso(digitsOnly('08/30/2026'), false)).toBe('2026-08-30');
    expect(digitsToIso(digitsOnly('08/01/2026'), false)).toBe('2026-08-01');
  });

  it('parses a valid Korean date (§7.2)', () => {
    expect(digitsToIso(digitsOnly('2026.08.30'), true)).toBe('2026-08-30');
    expect(digitsToIso(digitsOnly('2026.08.01'), true)).toBe('2026-08-01');
  });

  it('returns null while incomplete, never a partial/garbage ISO string', () => {
    expect(digitsToIso('0830', false)).toBeNull();
    expect(digitsToIso('', true)).toBeNull();
  });

  it('rejects an impossible calendar date instead of crashing (§8)', () => {
    expect(digitsToIso(digitsOnly('13/40/2026'), false)).toBeNull();
    expect(digitsToIso(digitsOnly('2026.99.99'), true)).toBeNull();
  });
});
