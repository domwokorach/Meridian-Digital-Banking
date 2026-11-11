import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransferInput } from '../src/lib/types';

// The shared setup mocks the api module for component tests; here we exercise the real client with a fake fetch.
const real = await vi.importActual<typeof import('../src/lib/api')>('../src/lib/api');
const { api, saveSession, storedSession } = real;

const ok = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
const readBlob = (blob: Blob) => new Promise<string>(resolve => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.readAsText(blob); });
const fetchMock = vi.fn();
const assign = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('location', { ...window.location, assign });
  saveSession({ token: 'abc.def.ghi', user: { id: 'u', fullName: 'A B', email: 'a@b.test' } });
});
afterEach(() => { vi.unstubAllGlobals(); fetchMock.mockReset(); assign.mockReset(); });

describe('session storage', () => {
  it('round-trips and clears the session', () => {
    expect(storedSession()?.token).toBe('abc.def.ghi');
    saveSession(null);
    expect(storedSession()).toBeNull();
  });
  it('ignores corrupted stored data', () => {
    sessionStorage.setItem('meridian_session_v1', '{not json');
    expect(storedSession()).toBeNull();
  });
});

describe('real API client', () => {
  it('requests accounts with the bearer token', async () => {
    fetchMock.mockReturnValue(ok([]));
    await api.accounts();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/accounts');
    expect(init.headers.Authorization).toBe('Bearer abc.def.ghi');
  });
  it('requests transactions for an encoded account id with a limit', async () => {
    fetchMock.mockReturnValue(ok([]));
    await api.transactions('a/b');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/accounts/a%2Fb/transactions?limit=100');
  });
  it('sends transfer amounts as two-decimal strings', async () => {
    fetchMock.mockReturnValue(ok({ id: 't' }));
    const input: TransferInput = { requestId: 'r', fromAccountId: 'f', toAccountId: 't', amount: 25.5, reference: 'x' };
    await api.transfer(input);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/transfers');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body).amount).toBe('25.50');
  });
  it('posts login and registration credentials', async () => {
    fetchMock.mockReturnValue(ok({ token: 't', user: {} }));
    await api.login('a@b.test', 'pw');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: 'a@b.test', password: 'pw' });
    fetchMock.mockReturnValue(ok({ token: 't', user: {} }));
    await api.register('Name', 'a@b.test', 'pw');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/register');
  });
  it('surfaces the server error message', async () => {
    fetchMock.mockReturnValue(ok({ error: 'Insufficient funds' }, 400));
    await expect(api.accounts()).rejects.toThrow('Insufficient funds');
  });
  it('falls back to a status message when the error body is not JSON', async () => {
    fetchMock.mockReturnValue(Promise.resolve(new Response('oops', { status: 500 })));
    await expect(api.accounts()).rejects.toThrow('Request failed (500)');
  });
  it('clears the session and redirects to login on 401', async () => {
    fetchMock.mockReturnValue(ok({ error: 'nope' }, 401));
    await expect(api.accounts()).rejects.toThrow();
    expect(storedSession()).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login');
  });
  it('does not redirect when a login attempt itself is rejected', async () => {
    fetchMock.mockReturnValue(ok({ error: 'Incorrect email or password' }, 401));
    await expect(api.login('a@b.test', 'bad')).rejects.toThrow('Incorrect email or password');
    expect(assign).not.toHaveBeenCalled();
  });
  it('downloads statements as a blob and reports failures', async () => {
    fetchMock.mockReturnValue(Promise.resolve(new Response('csv', { status: 200 })));
    const blob = await api.statement('id', '2026-01-01', '2026-01-31');
    expect(await readBlob(blob)).toBe('csv');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/accounts/id/statement?from=2026-01-01&to=2026-01-31');
    fetchMock.mockReturnValue(ok({ error: 'Choose a valid statement date range' }, 400));
    await expect(api.statement('id', 'x', 'y')).rejects.toThrow('Choose a valid statement date range');
  });
});
