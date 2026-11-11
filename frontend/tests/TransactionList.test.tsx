import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TransactionList from '../src/components/TransactionList';
import type { BankTransaction } from '../src/lib/types';
import { fixtureTransactions } from './fixtures';

describe('TransactionList', () => {
  it('shows an empty state when there is no activity', () => {
    render(<TransactionList items={[]}/>);
    expect(screen.getByText('No activity to show')).toBeInTheDocument();
  });
  it('signs money in and out and shows the running balance', () => {
    render(<TransactionList items={fixtureTransactions}/>);
    expect(screen.getByText('−£9.80')).toBeInTheDocument();
    expect(screen.getByText('+£1,149.00')).toBeInTheDocument();
    expect(screen.getByText('£1,055.65 balance')).toBeInTheDocument();
    expect(screen.getByText('£1,065.45 balance')).toBeInTheDocument();
  });
  it('marks credits as positive only', () => {
    render(<TransactionList items={fixtureTransactions}/>);
    expect(screen.getByText('+£1,149.00')).toHaveClass('positive');
    expect(screen.getByText('−£9.80')).not.toHaveClass('positive');
  });
  it('renders one row per transaction with description and date', () => {
    const { container } = render(<TransactionList items={fixtureTransactions}/>);
    expect(container.querySelectorAll('.transaction-row')).toHaveLength(3);
    expect(screen.getByText('Monthly savings interest')).toBeInTheDocument();
  });
  it('picks an icon for transfers, shopping, transport and anything else', () => {
    const base = { accountId: 'a', amount: 1, balanceAfter: 1, createdAt: '2026-01-01T00:00:00Z' };
    const rows: BankTransaction[] = [
      { ...base, id: '1', kind: 'DEBIT', description: 'Transfer to savings' },
      { ...base, id: '2', kind: 'CREDIT', description: 'Transfer from current' },
      { ...base, id: '3', kind: 'DEBIT', description: 'Groceries · Market' },
      { ...base, id: '4', kind: 'DEBIT', description: 'Transport · Rail' },
      { ...base, id: '5', kind: 'CREDIT', description: 'Something else' },
    ];
    const { container } = render(<TransactionList items={rows} showAccount/>);
    expect(container.querySelectorAll('.txn-icon svg')).toHaveLength(5);
    expect(screen.getAllByText(/Account activity/)).toHaveLength(5);
  });
});
