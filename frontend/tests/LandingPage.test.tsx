import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import LandingPage from '../src/pages/LandingPage';
import { renderPage } from './utils';

describe('homepage', () => {
  it('renders the hero, main navigation and product list', () => {
    renderPage(<LandingPage/>, { signedIn: null, withBank: false });
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/better way/i);
    expect(h1).toHaveTextContent(/your money/i);
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByText('Current accounts')).toBeInTheDocument();
    expect(screen.getByText('Savings accounts')).toBeInTheDocument();
  });
  it('offers a way to log in when signed out', () => {
    renderPage(<LandingPage/>, { signedIn: null, withBank: false });
    expect(screen.getAllByRole('link', { name: /log in|register|open an account|get started/i }).length).toBeGreaterThan(0);
  });
  it('filters products using the search query in the URL', () => {
    renderPage(<LandingPage/>, { route: '/?search=savings', signedIn: null, withBank: false });
    const grid = document.querySelector('.products-grid') as HTMLElement;
    expect(within(grid).getByText('Savings accounts')).toBeInTheDocument();
    expect(within(grid).queryByText('Mortgages')).not.toBeInTheDocument();
  });
  it('states clearly that Meridian is a fictional bank', () => {
    renderPage(<LandingPage/>, { signedIn: null, withBank: false });
    expect(screen.getAllByText(/fictional|not a real bank|portfolio/i).length).toBeGreaterThan(0);
  });
  it('toggles the mobile menu with an accessible button', async () => {
    renderPage(<LandingPage/>, { signedIn: null, withBank: false });
    const toggle = screen.getByRole('button', { name: /toggle menu/i });
    const nav = screen.getByRole('navigation', { name: /main navigation/i }).parentElement!;
    expect(nav).not.toHaveClass('nav-row-open');
    await userEvent.click(toggle);
    expect(nav).toHaveClass('nav-row-open');
    await userEvent.click(toggle);
    expect(nav).not.toHaveClass('nav-row-open');
    expect(within(document.body).getByRole('button', { name: /toggle menu/i })).toBeInTheDocument();
  });
});
