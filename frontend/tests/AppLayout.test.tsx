import { screen } from '@testing-library/react';
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
const sidebar = () => document.querySelector('.app-sidebar') as HTMLElement;

describe('signed-in layout and responsive navigation', () => {
  it('shows the user, the navigation links and the page content', () => {
    layout();
    expect(screen.getAllByText('Alex Morgan').length).toBeGreaterThan(0);
    const nav = screen.getByRole('navigation', { name: /your banking/i });
    for (const name of ['Overview', 'My accounts', 'Move money', 'Statements', 'Settings']) expect(nav).toHaveTextContent(name);
    expect(screen.getByText('Overview content')).toBeInTheDocument();
  });
  it('marks the current page in the navigation', () => {
    layout();
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveClass('sidebar-link-active');
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
  });
  it('opens and closes the mobile menu with labelled buttons', async () => {
    layout();
    expect(sidebar()).not.toHaveClass('sidebar-open');
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(sidebar()).toHaveClass('sidebar-open');
    await userEvent.click(screen.getAllByRole('button', { name: /close menu/i })[0]);
    expect(sidebar()).not.toHaveClass('sidebar-open');
  });
  it('closes the mobile menu from the scrim', async () => {
    layout();
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
    const scrim = document.querySelector('.sidebar-scrim') as HTMLElement;
    await userEvent.click(scrim);
    expect(sidebar()).not.toHaveClass('sidebar-open');
  });
  it('closes the mobile menu after choosing a destination', async () => {
    layout();
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
    await userEvent.click(screen.getByRole('link', { name: 'Move money' }));
    expect(sidebar()).not.toHaveClass('sidebar-open');
    expect(screen.getByText('Transfer content')).toBeInTheDocument();
  });
  it('signs the user out, clears the session and returns home', async () => {
    layout();
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(sessionStorage.getItem('meridian_session_v1')).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });
  it('states that the application is fictional', () => {
    layout();
    expect(screen.getByText(/fictional banking application/i)).toBeInTheDocument();
  });
});
