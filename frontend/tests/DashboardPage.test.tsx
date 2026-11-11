import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import DashboardPage from '../src/pages/DashboardPage';
import type { BankAccount } from '../src/lib/types';
import { everyday, fixtureAccounts, FIXTURE_TOTAL, savings } from './fixtures';
import { mockBank, mockedApi, renderPage } from './utils';

const account = (id: string, name: string, balance: number, type: BankAccount['accountType'] = 'CURRENT'): BankAccount =>
  ({ id, name, accountType: type, accountNumber: '1234' + id.padStart(4, '0'), sortCode: '10-20-30', balance });

describe('dashboard with the fixture accounts', () => {
  it('shows each balance and the total of £6,622.69', async () => {
    mockBank();
    renderPage(<DashboardPage/>);
    expect(await screen.findByText('YOUR TOTAL BALANCE', { exact: false })).toBeInTheDocument();
    const panel = document.querySelector('.balance-panel') as HTMLElement;
    expect(within(panel).getByRole('heading', { level: 2 })).toHaveTextContent(FIXTURE_TOTAL);
    expect(panel).toHaveTextContent('Across 2 accounts');
    expect(panel).toHaveTextContent('It’s all yours to manage');
    const cards = document.querySelectorAll<HTMLElement>('.account-card');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText('Everyday account')).toBeInTheDocument();
    expect(within(cards[0]).getByText('£1,065.45')).toBeInTheDocument();
    expect(cards[0]).toHaveTextContent('Sort code: 20-42-66');
    expect(cards[0]).toHaveTextContent('Account ending 1936');
    expect(within(cards[1]).getByText('Rainy day savings')).toBeInTheDocument();
    expect(within(cards[1]).getByText('£5,557.24')).toBeInTheDocument();
    expect(cards[1]).toHaveTextContent('Account ending 4472');
  });
  it('shows the account count next to "Your accounts"', async () => {
    mockBank();
    renderPage(<DashboardPage/>);
    const heading = await screen.findByRole('heading', { name: /^your accounts\s*2$/i });
    expect(heading).toBeInTheDocument();
  });
  it('keeps the transfer and accounts links', async () => {
    mockBank();
    renderPage(<DashboardPage/>);
    expect(await screen.findByRole('link', { name: /make a transfer/i })).toHaveAttribute('href', '/app/transfer');
    expect(screen.getByRole('link', { name: /view all accounts/i })).toHaveAttribute('href', '/app/accounts');
  });
  it('requests balances from the accounts API for the signed-in user', async () => {
    mockBank();
    renderPage(<DashboardPage/>);
    await screen.findByText('YOUR TOTAL BALANCE', { exact: false });
    expect(mockedApi.accounts).toHaveBeenCalledTimes(1);
    expect(mockedApi.transactions).toHaveBeenCalledWith(everyday.id);
    expect(mockedApi.transactions).toHaveBeenCalledWith(savings.id);
  });
  it('lists recent activity from the ledger', async () => {
    mockBank();
    renderPage(<DashboardPage/>);
    expect(await screen.findByText('Coffee · Brew Collective')).toBeInTheDocument();
    expect(screen.getByText('Salary · Acme Studio')).toBeInTheDocument();
  });
  it('greets the user by first name', async () => {
    mockBank();
    renderPage(<DashboardPage/>);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Alex');
  });
});

describe('total balance is calculated, never hardcoded', () => {
  it('equals the sum of whatever balances the API returns', async () => {
    mockBank([account('1', 'One', 10.1), account('2', 'Two', 20.2), account('3', 'Three', 0.07)], []);
    renderPage(<DashboardPage/>);
    await screen.findByText('YOUR TOTAL BALANCE', { exact: false });
    expect(document.querySelector('.balance-panel h2')).toHaveTextContent('£30.37');
    expect(document.querySelector('.balance-panel')).toHaveTextContent('Across 3 accounts');
  });
  it('displayed total equals the sum of the displayed card balances', async () => {
    mockBank(fixtureAccounts);
    renderPage(<DashboardPage/>);
    await screen.findByText('YOUR TOTAL BALANCE', { exact: false });
    const parse = (s: string) => Math.round(Number(s.replace(/[£,]/g, '')) * 100);
    const cards = [...document.querySelectorAll('.account-card-balance')].map(n => parse(n.textContent!));
    const total = parse(document.querySelector('.balance-panel h2')!.textContent!);
    expect(cards.reduce((a, b) => a + b, 0)).toBe(total);
  });
  it('uses the singular for one account', async () => {
    mockBank([account('1', 'Solo', 12.5)], []);
    renderPage(<DashboardPage/>);
    await screen.findByText('YOUR TOTAL BALANCE', { exact: false });
    expect(document.querySelector('.balance-panel')).toHaveTextContent('Across 1 account ');
    expect(document.querySelector('.balance-panel h2')).toHaveTextContent('£12.50');
  });
  it('shows £0.00 and an empty-state message when there are no accounts', async () => {
    mockBank([], []);
    renderPage(<DashboardPage/>);
    expect(await screen.findByText(/no accounts yet/i)).toBeInTheDocument();
    expect(document.querySelector('.balance-panel h2')).toHaveTextContent('£0.00');
    expect(document.querySelectorAll('.account-card')).toHaveLength(0);
  });
});

describe('loading and error states', () => {
  it('shows a loading message until data arrives', async () => {
    let release!: (a: BankAccount[]) => void;
    mockedApi.accounts.mockReturnValue(new Promise(r => { release = r; }));
    mockedApi.transactions.mockResolvedValue([]);
    renderPage(<DashboardPage/>);
    expect(screen.getByText(/getting your accounts ready/i)).toBeInTheDocument();
    expect(screen.queryByText(/your total balance/i)).not.toBeInTheDocument();
    release(fixtureAccounts);
    expect(await screen.findByText('YOUR TOTAL BALANCE', { exact: false })).toBeInTheDocument();
  });
  it('shows the API error and recovers when the user retries', async () => {
    mockedApi.accounts.mockRejectedValueOnce(new Error('Request failed (500)'));
    renderPage(<DashboardPage/>);
    expect(await screen.findByText(/couldn't load your banking data/i)).toBeInTheDocument();
    expect(screen.getByText('Request failed (500)')).toBeInTheDocument();
    expect(screen.queryByText(FIXTURE_TOTAL)).not.toBeInTheDocument();
    mockBank();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('YOUR TOTAL BALANCE', { exact: false })).toBeInTheDocument();
    expect(document.querySelector('.balance-panel h2')).toHaveTextContent(FIXTURE_TOTAL);
  });
  it('shows an error when the transactions request fails', async () => {
    mockedApi.accounts.mockResolvedValue(fixtureAccounts);
    mockedApi.transactions.mockRejectedValue(new Error('Request failed (503)'));
    renderPage(<DashboardPage/>);
    expect(await screen.findByText('Request failed (503)')).toBeInTheDocument();
  });
});
