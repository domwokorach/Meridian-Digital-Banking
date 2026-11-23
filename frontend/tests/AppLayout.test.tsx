import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import AppLayout from '../src/components/AppLayout';
import { session } from './fixtures';
import { LocationProbe, mockBank } from './utils';

// Mirrors App.tsx: the layout is only rendered for a signed-in user.
function RequireAuth({ children }: { children: ReactNode }) { return useAuth().session ? <>{children}</> : <Navigate to="/" replace/>; }
function layout(route = '/app') {
  mockBank();
  sessionStorage.setItem('meridian_session_v1', JSON.stringify(session));
  return render(<MemoryRouter initialEntries={[route]}><AuthProvider><Routes>
    <Route path="/app" element={<RequireAuth><AppLayout/></RequireAuth>}><Route index element={<div>Overview content</div>}/><Route path="transfer" element={<div>Transfer content</div>}/></Route>
    <Route path="*" element={<LocationProbe/>}/>
  </Routes></AuthProvider></MemoryRouter>);
}

describe('signed-in layout and responsive navigation', () => {
  it('shows the primary navigation links and the page content', () => {
    layout();
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    for (const name of ['Home', 'Payments & Transfers', 'Accounts', 'Cards', 'Products', 'Support']) expect(nav).toHaveTextContent(name);
    expect(screen.getByText('Overview content')).toBeInTheDocument();
  });
  it('marks the current page in the navigation', () => {
    layout();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Cards' })).not.toHaveAttribute('aria-current');
  });
  it('provides search, notifications and a theme toggle with accessible names', () => {
    layout();
    expect(screen.getAllByRole('button', { name: 'Search' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /notifications, 2 unread/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });
  it('defaults to dark mode and toggles to light', async () => {
    layout();
    expect(document.documentElement).toHaveClass('dark');
    await userEvent.click(screen.getByRole('button', { name: /switch to light mode/i }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('meridian_theme')).toBe('light');
  });
  it('opens the mobile menu and closes it after choosing a destination', async () => {
    layout();
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
    const mobile = await screen.findByRole('navigation', { name: 'Mobile' });
    await userEvent.click(screen.getAllByRole('link', { name: 'Payments & Transfers' }).find(l => mobile.contains(l))!);
    expect(screen.getByText('Transfer content')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument());
  });
  it('closes the mobile menu with Escape', async () => {
    layout();
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
    await screen.findByRole('navigation', { name: 'Mobile' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument());
  });
  it('shows the user in the account menu and signs out, clearing the session', async () => {
    layout();
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(await screen.findByText('Alex Morgan')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }));
    expect(sessionStorage.getItem('meridian_session_v1')).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });
  it('states that the application is fictional', () => {
    layout();
    expect(screen.getByText(/fictional banking application/i)).toBeInTheDocument();
  });
});
