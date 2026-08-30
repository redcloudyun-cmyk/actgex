import { describe, expect, it } from 'vitest';
import en from '../i18n/dictionaries/en';
import ko from '../i18n/dictionaries/ko';
import { categoryLabelKey } from './categories';
import { CATEGORY_IDS } from './types';

describe('canonical category ids', () => {
  it('has a non-empty English and Korean label for every canonical id', () => {
    for (const id of CATEGORY_IDS) {
      const key = categoryLabelKey(id);
      expect(en[key as keyof typeof en], `en missing ${key}`).toBeTruthy();
      expect(ko[key as keyof typeof ko], `ko missing ${key}`).toBeTruthy();
    }
  });

  it('never stores a localized string as the id itself', () => {
    for (const id of CATEGORY_IDS) {
      expect(id).toBe(id.toUpperCase());
      expect(id).not.toBe(en[categoryLabelKey(id) as keyof typeof en]);
      expect(id).not.toBe(ko[categoryLabelKey(id) as keyof typeof ko]);
    }
  });
});
