import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import TransferPage from '../src/pages/TransferPage';
import { everyday, savings } from './fixtures';
import { mockBank, mockedApi, renderPage } from './utils';

const result = { id: 't', fromAccountId: everyday.id, toAccountId: savings.id, amount: 25.5, reference: 'x', createdAt: '2026-01-01T00:00:00Z' };
async function open() {
  mockBank();
  renderPage(<TransferPage/>, { route: '/app/transfer' });
  await screen.findByRole('heading', { name: 'Make a transfer' });
}
const amountInput = () => screen.getByLabelText(/^amount/i);
const review = () => screen.getByRole('button', { name: /review transfer/i });
const confirmBtn = () => screen.getByRole('button', { name: /confirm transfer|processing/i });
async function fillAndReview(amount: string) { await userEvent.type(amountInput(), amount); await waitFor(() => expect(review()).toBeEnabled()); await userEvent.click(review()); await screen.findByRole('dialog'); }

describe('transfer form validation', () => {
  it('defaults to the first account as source and the second as destination', async () => {
    await open();
    expect(screen.getByLabelText(/from account/i)).toHaveValue(everyday.id);
    expect(screen.getByLabelText(/to account/i)).toHaveValue(savings.id);
    expect(screen.getByText('£1,065.45')).toBeInTheDocument();
  });
  it('keeps the button disabled until a valid amount is entered', async () => {
    await open();
    expect(review()).toBeDisabled();
    await userEvent.type(amountInput(), '25.50');
    await waitFor(() => expect(review()).toBeEnabled());
  });
  it('rejects amounts with more than two decimals, zero and negatives', async () => {
    await open();
    for (const bad of ['1.234', '0', '-5']) {
      await userEvent.clear(amountInput());
      await userEvent.type(amountInput(), bad);
      await waitFor(() => expect(review(), bad).toBeDisabled());
    }
  });
  it('warns when the amount exceeds the available balance and blocks submission', async () => {
    await open();
    await userEvent.type(amountInput(), '1065.46');
    expect(await screen.findByText(/exceeds your available balance/i)).toBeInTheDocument();
    expect(review()).toBeDisabled();
  });
  it('allows transferring exactly the whole balance', async () => {
    await open();
    await userEvent.type(amountInput(), '1065.45');
    await waitFor(() => expect(review()).toBeEnabled());
    expect(screen.queryByText(/exceeds your available balance/i)).not.toBeInTheDocument();
  });
  it('disables submission when both accounts are the same', async () => {
    await open();
    await userEvent.type(amountInput(), '5');
    await userEvent.selectOptions(screen.getByLabelText(/to account/i), everyday.id);
    expect(await screen.findByText('Choose two different accounts')).toBeInTheDocument();
    expect(review()).toBeDisabled();
  });
  it('enforces the £50,000 cap', async () => {
    await open();
    await userEvent.type(amountInput(), '50000.01');
    expect(await screen.findByText(/limit is £50,000/i)).toBeInTheDocument();
    expect(review()).toBeDisabled();
  });
});

describe('submitting a transfer', () => {
  it('asks for confirmation first and sends nothing until the user confirms', async () => {
    await open();
    await fillAndReview('25.50');
    expect(screen.getByRole('dialog')).toHaveTextContent('£25.50');
    expect(mockedApi.transfer).not.toHaveBeenCalled();
  });
  it('sends the transfer with a unique request id, refreshes balances and confirms', async () => {
    await open();
    mockedApi.transfer.mockResolvedValue(result);
    await fillAndReview('25.50');
    await userEvent.click(confirmBtn());
    expect(await screen.findByRole('heading', { name: 'Money on the move' })).toBeInTheDocument();
    const sent = mockedApi.transfer.mock.calls[0][0];
    expect(sent).toMatchObject({ fromAccountId: everyday.id, toAccountId: savings.id, amount: 25.5 });
    expect(sent.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(mockedApi.accounts).toHaveBeenCalledTimes(2); // initial load + refresh after the transfer
  });
  it('shows the server error and does not claim success when the transfer fails', async () => {
    await open();
    mockedApi.transfer.mockRejectedValue(new Error('Insufficient funds'));
    await fillAndReview('10');
    await userEvent.click(confirmBtn());
    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient funds');
    expect(screen.queryByRole('heading', { name: 'Money on the move' })).not.toBeInTheDocument();
    expect(mockedApi.accounts).toHaveBeenCalledTimes(1); // no refresh after a failure
  });
  it('shows a fallback message for non-Error failures', async () => {
    await open();
    mockedApi.transfer.mockRejectedValue('boom');
    await fillAndReview('10');
    await userEvent.click(confirmBtn());
    expect(await screen.findByRole('alert')).toHaveTextContent('Transfer could not be completed');
  });
  it('prevents a double submit while a transfer is processing', async () => {
    await open();
    let finish!: (v: typeof result) => void;
    mockedApi.transfer.mockReturnValue(new Promise(r => { finish = r; }));
    await fillAndReview('10');
    await userEvent.click(confirmBtn());
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
    expect(mockedApi.transfer).toHaveBeenCalledTimes(1);
    finish(result);
    await screen.findByRole('heading', { name: 'Money on the move' });
  });
});

describe('paying someone (sandbox)', () => {
  it('never claims a payment was sent', async () => {
    mockBank();
    renderPage(<TransferPage/>, { route: '/app/transfer?tab=pay' });
    await userEvent.selectOptions(await screen.findByLabelText('Payee'), 'b1');
    await userEvent.type(screen.getByLabelText('Amount'), '10');
    await userEvent.type(screen.getByLabelText('Reference'), 'Lunch');
    await waitFor(() => expect(screen.getByRole('button', { name: /review payment/i })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: /review payment/i }));
    await userEvent.click(await screen.findByRole('button', { name: /finish rehearsal/i }));
    expect(await screen.findByText('Nothing was sent')).toBeInTheDocument();
    expect(mockedApi.transfer).not.toHaveBeenCalled();
  });
});
