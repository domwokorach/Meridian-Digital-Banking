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
  // The page assigns its default accounts in an effect, one render after the data arrives.
  await waitFor(() => expect(screen.getByLabelText(/to account/i)).toHaveValue(savings.id));
}
const amountInput = () => screen.getByLabelText(/^amount/i);
const submit = () => screen.getByRole('button', { name: /confirm transfer/i });

describe('transfer form validation', () => {
  it('defaults to the first account as source and the second as destination', async () => {
    await open();
    expect(screen.getByLabelText(/from account/i)).toHaveValue(everyday.id);
    expect(screen.getByLabelText(/to account/i)).toHaveValue(savings.id);
    expect(screen.getByText('£1,065.45')).toBeInTheDocument();
  });
  it('keeps the button disabled until a valid amount is entered', async () => {
    await open();
    expect(submit()).toBeDisabled();
    await userEvent.type(amountInput(), '25.50');
    expect(submit()).toBeEnabled();
  });
  it('rejects amounts with more than two decimals, zero and negatives', async () => {
    await open();
    for (const bad of ['1.234', '0', '-5']) {
      await userEvent.clear(amountInput());
      await userEvent.type(amountInput(), bad);
      expect(submit(), bad).toBeDisabled();
    }
  });
  it('warns when the amount exceeds the available balance and blocks submission', async () => {
    await open();
    await userEvent.type(amountInput(), '1065.46');
    expect(screen.getByText(/exceeds your available balance/i)).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });
  it('allows transferring exactly the whole balance', async () => {
    await open();
    await userEvent.type(amountInput(), '1065.45');
    expect(screen.queryByText(/exceeds your available balance/i)).not.toBeInTheDocument();
    expect(submit()).toBeEnabled();
  });
  it('disables submission when both accounts are the same', async () => {
    await open();
    await userEvent.type(amountInput(), '5');
    await userEvent.selectOptions(screen.getByLabelText(/to account/i), everyday.id);
    expect(submit()).toBeDisabled();
  });
  it('caps the amount at £50,000 via the input constraints', async () => {
    await open();
    expect(amountInput()).toHaveAttribute('max', '50000');
    expect(amountInput()).toHaveAttribute('min', '0.01');
  });
});

describe('submitting a transfer', () => {
  it('sends the transfer with a unique request id, refreshes balances and confirms', async () => {
    await open();
    mockedApi.transfer.mockResolvedValue(result);
    await userEvent.type(amountInput(), '25.50');
    await userEvent.click(submit());
    await waitFor(() => expect(screen.getByText('TRANSFER COMPLETE')).toBeInTheDocument());
    const sent = mockedApi.transfer.mock.calls[0][0];
    expect(sent).toMatchObject({ fromAccountId: everyday.id, toAccountId: savings.id, amount: 25.5 });
    expect(sent.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(mockedApi.accounts).toHaveBeenCalledTimes(2); // initial load + refresh after the transfer
  });
  it('uses a new request id for each separate transfer', async () => {
    await open();
    mockedApi.transfer.mockResolvedValue(result);
    await userEvent.type(amountInput(), '1');
    await userEvent.click(submit());
    await screen.findByText('TRANSFER COMPLETE');
    expect(mockedApi.transfer).toHaveBeenCalledTimes(1);
  });
  it('shows the server error and does not claim success when the transfer fails', async () => {
    await open();
    mockedApi.transfer.mockRejectedValue(new Error('Insufficient funds'));
    await userEvent.type(amountInput(), '10');
    await userEvent.click(submit());
    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient funds');
    expect(screen.queryByText('TRANSFER COMPLETE')).not.toBeInTheDocument();
    expect(mockedApi.accounts).toHaveBeenCalledTimes(1); // no refresh after a failure
  });
  it('shows a fallback message for non-Error failures', async () => {
    await open();
    mockedApi.transfer.mockRejectedValue('boom');
    await userEvent.type(amountInput(), '10');
    await userEvent.click(submit());
    expect(await screen.findByRole('alert')).toHaveTextContent('Transfer could not be completed');
  });
  it('prevents a double submit while a transfer is processing', async () => {
    await open();
    let finish!: (v: typeof result) => void;
    mockedApi.transfer.mockReturnValue(new Promise(r => { finish = r; }));
    await userEvent.type(amountInput(), '10');
    await userEvent.click(submit());
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
    expect(mockedApi.transfer).toHaveBeenCalledTimes(1);
    finish(result);
    await screen.findByText('TRANSFER COMPLETE');
  });
});
