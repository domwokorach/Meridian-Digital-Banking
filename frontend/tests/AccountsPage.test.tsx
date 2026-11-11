import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import AccountsPage from '../src/pages/AccountsPage';
import { everyday, savings } from './fixtures';
import { mockBank, mockedApi, renderPage } from './utils';

describe('accounts page and transaction history', () => {
  it('shows the first account and its history by default', async () => {
    mockBank();
    renderPage(<AccountsPage/>, { route: '/app/accounts' });
    expect(await screen.findByRole('heading', { name: 'Everyday account' })).toBeInTheDocument();
    expect(screen.getByText('Coffee · Brew Collective')).toBeInTheDocument();
    expect(screen.queryByText('Monthly savings interest')).not.toBeInTheDocument();
    expect(screen.getByText('2 transactions')).toBeInTheDocument();
  });
  it('preselects the account from the query string', async () => {
    mockBank();
    renderPage(<AccountsPage/>, { route: `/app/accounts?account=${savings.id}` });
    expect(await screen.findByRole('heading', { name: 'Rainy day savings' })).toBeInTheDocument();
    expect(screen.getByText('Monthly savings interest')).toBeInTheDocument();
  });
  it('switches accounts', async () => {
    mockBank();
    renderPage(<AccountsPage/>, { route: '/app/accounts' });
    await screen.findByRole('heading', { name: 'Everyday account' });
    await userEvent.click(within(document.querySelector('.account-switcher') as HTMLElement).getByRole('button', { name: 'Rainy day savings' }));
    expect(await screen.findByRole('heading', { name: 'Rainy day savings' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(`account=${savings.id}`);
  });
  it('filters by money in / money out', async () => {
    mockBank();
    renderPage(<AccountsPage/>, { route: '/app/accounts' });
    await screen.findByRole('heading', { name: 'Everyday account' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /transaction type/i }), 'CREDIT');
    expect(screen.getByText('Salary · Acme Studio')).toBeInTheDocument();
    expect(screen.queryByText('Coffee · Brew Collective')).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /transaction type/i }), 'DEBIT');
    expect(screen.getByText('Coffee · Brew Collective')).toBeInTheDocument();
    expect(screen.queryByText('Salary · Acme Studio')).not.toBeInTheDocument();
  });
  it('searches descriptions case-insensitively and can match nothing', async () => {
    mockBank();
    renderPage(<AccountsPage/>, { route: '/app/accounts' });
    await screen.findByRole('heading', { name: 'Everyday account' });
    await userEvent.type(screen.getByPlaceholderText('Search transactions'), 'SALARY');
    expect(screen.getByText('Salary · Acme Studio')).toBeInTheDocument();
    expect(screen.queryByText('Coffee · Brew Collective')).not.toBeInTheDocument();
    await userEvent.clear(screen.getByPlaceholderText('Search transactions'));
    await userEvent.type(screen.getByPlaceholderText('Search transactions'), 'zzz');
    expect(screen.getByText('No activity to show')).toBeInTheDocument();
  });
  it('shows the account details with the exact balance', async () => {
    mockBank();
    renderPage(<AccountsPage/>, { route: '/app/accounts' });
    await screen.findByRole('heading', { name: 'Everyday account' });
    expect(screen.getAllByText('£1,065.45').length).toBeGreaterThan(0);
    expect(screen.getByText(everyday.accountNumber)).toBeInTheDocument();
  });
  it('handles no accounts and ignores an unknown account in the URL', async () => {
    mockBank([], []);
    renderPage(<AccountsPage/>, { route: '/app/accounts' });
    expect(await screen.findByText('No accounts available.')).toBeInTheDocument();
  });
  it('falls back to the first account when the id in the URL is unknown', async () => {
    mockBank();
    renderPage(<AccountsPage/>, { route: '/app/accounts?account=does-not-exist' });
    expect(await screen.findByRole('heading', { name: 'Everyday account' })).toBeInTheDocument();
    expect(mockedApi.accounts).toHaveBeenCalled();
  });
});
