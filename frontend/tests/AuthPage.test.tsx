import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import AuthPage from '../src/pages/AuthPage';
import { mockedApi, renderRoutes } from './utils';
import { session } from './fixtures';

const loginPage = () => renderRoutes(<AuthPage mode="login"/>, '/login', null);
const registerPage = () => renderRoutes(<AuthPage mode="register"/>, '/register', null);

describe('login form', () => {
  it('has labelled email and password fields and a submit button', () => {
    loginPage();
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /log in securely/i })).toBeEnabled();
  });
  it('submits the entered credentials and goes to the dashboard', async () => {
    mockedApi.login.mockResolvedValue(session);
    loginPage();
    await userEvent.type(screen.getByLabelText(/email address/i), 'alex@example.test');
    await userEvent.type(screen.getByLabelText(/^password/i), 'a-long-password');
    await userEvent.click(screen.getByRole('button', { name: /log in securely/i }));
    expect(mockedApi.login).toHaveBeenCalledWith('alex@example.test', 'a-long-password');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/app'));
  });
  it('shows the server error in an alert and stays on the page', async () => {
    mockedApi.login.mockRejectedValue(new Error('Incorrect email or password'));
    loginPage();
    await userEvent.type(screen.getByLabelText(/email address/i), 'alex@example.test');
    await userEvent.type(screen.getByLabelText(/^password/i), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: /log in securely/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password');
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();
  });
  it('disables the button while the request is in flight', async () => {
    let finish!: (v: typeof session) => void;
    mockedApi.login.mockReturnValue(new Promise(r => { finish = r; }));
    loginPage();
    await userEvent.type(screen.getByLabelText(/email address/i), 'alex@example.test');
    await userEvent.type(screen.getByLabelText(/^password/i), 'a-long-password');
    await userEvent.click(screen.getByRole('button', { name: /log in securely/i }));
    expect(screen.getByRole('button', { name: /please wait/i })).toBeDisabled();
    finish(session);
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/app'));
  });
  it('fills the fictional demo credentials on request', async () => {
    loginPage();
    await userEvent.click(screen.getByRole('button', { name: /fill demo login/i }));
    expect(screen.getByLabelText(/email address/i)).toHaveValue('demo@meridian.test');
    expect(screen.getByLabelText(/^password/i)).toHaveValue('Demo1234!');
  });
  it('can show and hide the password', async () => {
    loginPage();
    const field = screen.getByLabelText(/^password/i);
    await userEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(field).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(field).toHaveAttribute('type', 'password');
  });
  it('redirects an already signed-in user to the dashboard', () => {
    renderRoutes(<AuthPage mode="login"/>, '/login', session);
    expect(screen.getByTestId('location')).toHaveTextContent('/app');
  });
});

describe('registration form', () => {
  it('asks for name, email and a password of at least ten characters', () => {
    registerPage();
    expect(screen.getByLabelText(/full name/i)).toBeRequired();
    expect(screen.getByLabelText(/email address/i)).toBeRequired();
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('minlength', '10');
    expect(screen.getByText(/do not use a real banking password/i)).toBeInTheDocument();
  });
  it('registers with the entered details', async () => {
    mockedApi.register.mockResolvedValue(session);
    registerPage();
    await userEvent.type(screen.getByLabelText(/full name/i), 'Casey Test');
    await userEvent.type(screen.getByLabelText(/email address/i), 'casey@example.test');
    await userEvent.type(screen.getByLabelText(/^password/i), 'ten-chars-ok');
    await userEvent.click(screen.getByRole('button', { name: /create demo account/i }));
    expect(mockedApi.register).toHaveBeenCalledWith('Casey Test', 'casey@example.test', 'ten-chars-ok');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/app'));
  });
  it('shows a conflict error from the server', async () => {
    mockedApi.register.mockRejectedValue(new Error('An account with this email already exists'));
    registerPage();
    await userEvent.type(screen.getByLabelText(/full name/i), 'Casey Test');
    await userEvent.type(screen.getByLabelText(/email address/i), 'casey@example.test');
    await userEvent.type(screen.getByLabelText(/^password/i), 'ten-chars-ok');
    await userEvent.click(screen.getByRole('button', { name: /create demo account/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i);
  });
  it('links to the login page', () => {
    registerPage();
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
  });
});
