import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import BankCard from '../src/components/cards/BankCard';
import CardsPage from '../src/pages/CardsPage';
import { demoContent } from '../src/lib/demo';
import { renderPage } from './utils';

const cards = demoContent.cards('Alex Morgan');
describe('BankCard', () => {
  it('only ever shows the last four digits', () => {
    const { container } = render(<BankCard card={cards[0]}/>);
    expect(screen.getByTestId('card-number')).toHaveTextContent('•••• •••• •••• 4821');
    expect(container.textContent).not.toMatch(/\d{12,}/);
  });
  it('flips with the keyboard and reports its state', async () => {
    render(<BankCard card={cards[0]}/>);
    const card = screen.getByRole('button', { name: /midnight black debit card ending 4821/i });
    expect(card).toHaveAttribute('aria-pressed', 'false');
    card.focus(); await userEvent.keyboard('{Enter}');
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });
  it('labels frozen cards', () => {
    render(<BankCard card={{ ...cards[0], frozen: true }}/>);
    expect(screen.getByRole('button', { name: /frozen/i })).toBeInTheDocument();
  });
  it('has no detectable accessibility violations', async () => {
    const { container } = render(<BankCard card={cards[2]}/>);
    expect(await axe(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })).toHaveNoViolations();
  });
});
describe('CardsPage', () => {
  it('freezes and unfreezes a demo card and remembers it', async () => {
    renderPage(<CardsPage/>, { withBank: false });
    const freeze = screen.getByRole('switch', { name: /freeze card/i });
    expect(freeze).not.toBeChecked();
    await userEvent.click(freeze);
    expect(freeze).toBeChecked();
    expect(JSON.parse(localStorage.getItem('meridian_demo_card_settings_v1')!)['card-midnight'].frozen).toBe(true);
    await userEvent.click(freeze);
    expect(freeze).not.toBeChecked();
  });
  it('labels the cards as demo data and masks details in the dialog', async () => {
    renderPage(<CardsPage/>, { withBank: false });
    expect(screen.getByText(/demo cards/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /card details/i }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('•••• •••• •••• 4821');
  });
});
