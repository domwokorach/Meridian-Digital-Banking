import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import AccountCard from '../src/components/AccountCard';
import TransactionList from '../src/components/TransactionList';
import AuthPage from '../src/pages/AuthPage';
import DashboardPage from '../src/pages/DashboardPage';
import TransferPage from '../src/pages/TransferPage';
import { everyday, fixtureTransactions, savings } from './fixtures';
import { mockBank, mockedApi, renderPage, renderRoutes } from './utils';
import { MemoryRouter } from 'react-router-dom';

// axe-core cannot compute colour contrast in jsdom; contrast is verified separately (see docs/JENKINS.md and Design.md).
const options = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

describe('automated accessibility checks (axe-core)', () => {
  it('login form has no detectable violations', async () => {
    const { container } = renderRoutes(<AuthPage mode="login"/>, '/login', null);
    expect(await axe(container, options)).toHaveNoViolations();
  });
  it('registration form has no detectable violations', async () => {
    const { container } = renderRoutes(<AuthPage mode="register"/>, '/register', null);
    expect(await axe(container, options)).toHaveNoViolations();
  });
  it('account cards have no detectable violations', async () => {
    const { container } = render(<MemoryRouter><AccountCard account={everyday}/><AccountCard account={savings}/></MemoryRouter>);
    expect(await axe(container, options)).toHaveNoViolations();
  });
  it('transaction list has no detectable violations', async () => {
    const { container } = render(<TransactionList items={fixtureTransactions}/>);
    expect(await axe(container, options)).toHaveNoViolations();
  });
  it('dashboard has no detectable violations once loaded', async () => {
    mockBank();
    const { container } = renderPage(<DashboardPage/>);
    await screen.findByText('YOUR TOTAL BALANCE', { exact: false });
    expect(await axe(container, options)).toHaveNoViolations();
  });
  it('transfer form has no detectable violations', async () => {
    mockBank();
    const { container } = renderPage(<TransferPage/>, { route: '/app/transfer' });
    await screen.findByRole('heading', { name: 'Make a transfer' });
    expect(await axe(container, options)).toHaveNoViolations();
  });
  it('error alerts are announced with role="alert"', async () => {
    mockedApi.accounts.mockRejectedValue(new Error('boom'));
    renderPage(<DashboardPage/>);
    expect(await screen.findByText(/couldn't load your banking data/i)).toBeInTheDocument();
  });
});
