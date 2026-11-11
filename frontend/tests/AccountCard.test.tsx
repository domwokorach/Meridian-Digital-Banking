import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AccountCard from '../src/components/AccountCard';
import { everyday, savings } from './fixtures';
import { renderPage } from './utils';

describe('AccountCard', () => {
  it('shows name, GBP balance, sort code and account ending', () => {
    renderPage(<AccountCard account={everyday}/>, { withBank: false });
    expect(screen.getByText('Everyday account')).toBeInTheDocument();
    expect(screen.getByText('£1,065.45')).toBeInTheDocument();
    expect(screen.getByText(/Sort code: 20-42-66/)).toBeInTheDocument();
    expect(screen.getByText(/Account ending 1936/)).toBeInTheDocument();
  });
  it('never reveals the full account number', () => {
    const { container } = renderPage(<AccountCard account={everyday}/>, { withBank: false });
    expect(container).not.toHaveTextContent('48271936');
  });
  it('styles savings accounts differently from current accounts', () => {
    const { container } = renderPage(<AccountCard account={savings}/>, { withBank: false });
    expect(container.querySelector('.account-card')).toHaveClass('account-card-savings');
    expect(screen.getByText('£5,557.24')).toBeInTheDocument();
  });
  it('links to the account with an accessible name', () => {
    renderPage(<AccountCard account={savings}/>, { withBank: false });
    expect(screen.getByRole('link', { name: 'View Rainy day savings' })).toHaveAttribute('href', `/app/accounts?account=${savings.id}`);
  });
  it('supports the compact variant', () => {
    const { container } = renderPage(<AccountCard account={everyday} compact/>, { withBank: false });
    expect(container.querySelector('.account-card')).toHaveClass('account-card-compact');
  });
});
