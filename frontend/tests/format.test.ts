import { describe, expect, it } from 'vitest';
import { accountEnding, dateLabel, firstName, initials, isoDate, maskedAccount, money, shortMoney, sumMoney } from '../src/lib/format';
import { fixtureAccounts, FIXTURE_TOTAL } from './fixtures';

describe('money formatting', () => {
  it('formats GBP with exactly two decimal places', () => {
    expect(money(6622.69)).toBe('£6,622.69');
    expect(money(1065.45)).toBe('£1,065.45');
    expect(money(5)).toBe('£5.00');
    expect(money(0)).toBe('£0.00');
    expect(money(1234567.8)).toBe('£1,234,567.80');
  });
  it('rounds the short form to whole pounds', () => {
    expect(shortMoney(126.9)).toBe('£127');
  });
});

describe('sumMoney', () => {
  it('equals the sum of the fixture balances: £1,065.45 + £5,557.24 = £6,622.69', () => {
    expect(money(sumMoney(fixtureAccounts.map(a => a.balance)))).toBe(FIXTURE_TOTAL);
  });
  it('avoids floating-point drift that a plain reduce would introduce', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
  });
  it('is zero for no accounts and handles a single account', () => {
    expect(sumMoney([])).toBe(0);
    expect(sumMoney([99.99])).toBe(99.99);
  });
  it('stays exact over many small amounts', () => {
    expect(sumMoney(Array.from({ length: 1000 }, () => 0.01))).toBe(10);
  });
  it('supports negative amounts', () => {
    expect(sumMoney([100, -0.01])).toBe(99.99);
  });
});

describe('display helpers', () => {
  it('describes an account by its last four digits', () => {
    expect(accountEnding('48271936')).toBe('Account ending 1936');
    expect(maskedAccount('68104472')).toBe('•••• 4472');
  });
  it('derives first names and initials', () => {
    expect(firstName('  Alex   Morgan ')).toBe('Alex');
    expect(initials('alex morgan')).toBe('AM');
    expect(initials('Cher')).toBe('C');
    expect(initials('Mary Jane Watson')).toBe('MJ');
  });
  it('formats dates in en-GB and builds ISO dates', () => {
    expect(dateLabel('2026-03-05T12:00:00Z')).toBe('5 Mar 2026');
    expect(isoDate(0)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(isoDate(1) < isoDate(0)).toBe(true);
  });
});
