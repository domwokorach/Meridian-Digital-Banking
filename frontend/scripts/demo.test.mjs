import test from 'node:test';
import assert from 'node:assert/strict';
import { demo } from '../src/lib/demo.ts';
const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };

test('demo credentials grant a simulated banking session', () => {
  assert.equal(demo.signIn('demo@meridian.test', 'Demo1234!').user.fullName, 'Alex Morgan');
  assert.throws(() => demo.signIn('demo@meridian.test', 'incorrect'));
});
test('banking starts with two demo accounts and a coherent current-account ledger', () => {
  const accounts = demo.accounts();
  assert.equal(accounts.length, 2);
  assert.equal(accounts[0].balance, 1065.45);
  assert.equal(accounts[1].balance, 5557.24);
  assert.equal(demo.transactions(accounts[0].id)[0].balanceAfter, accounts[0].balance);
});
test('transfers move simulated funds, create ledger rows and reject retries', () => {
  const [from, to] = demo.accounts();
  const req = { requestId: crypto.randomUUID(), fromAccountId: from.id, toAccountId: to.id, amount: 50.2, reference: 'Portfolio smoke test' };
  const saved = demo.transfer(req);
  assert.equal(saved.amount, 50.2);
  assert.equal(demo.accounts()[0].balance, 1015.25);
  assert.equal(demo.accounts()[1].balance, 5607.44);
  assert.match(demo.transactions(from.id)[0].description, /Portfolio smoke test/);
  assert.equal(demo.transfer(req).id, saved.id);
  assert.equal(demo.accounts()[0].balance, 1015.25);
});
test('overdraft, duplicate account and too-large transfers are rejected', () => {
  const [from, to] = demo.accounts();
  assert.throws(() => demo.transfer({ requestId: crypto.randomUUID(), fromAccountId: from.id, toAccountId: to.id, amount: 999999, reference: '' }));
  assert.throws(() => demo.transfer({ requestId: crypto.randomUUID(), fromAccountId: from.id, toAccountId: from.id, amount: 1, reference: '' }));
});
test('statement export contains transaction descriptions and running balances', async () => {
  const [account] = demo.accounts();
  const text = await demo.statement(account.id, '2020-01-01', new Date().toISOString().slice(0, 10)).text();
  assert.match(text, /Amount \(GBP\)/);
  assert.match(text, /Portfolio smoke test/);
  assert.match(text, /1015\.25/);
});
