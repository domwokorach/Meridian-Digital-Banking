import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import TransferPage from './pages/TransferPage';
import StatementsPage from './pages/StatementsPage';
import SettingsPage from './pages/SettingsPage';
function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  return session ? <>{children}</> : <Navigate to="/login" replace/>;
}
export default function App() {
  return <Routes>
    <Route path="/" element={<LandingPage/>}/>
    <Route path="/login" element={<AuthPage mode="login"/>}/>
    <Route path="/register" element={<AuthPage mode="register"/>}/>
    <Route path="/app" element={<RequireAuth><AppLayout/></RequireAuth>}>
      <Route index element={<DashboardPage/>}/>
      <Route path="accounts" element={<AccountsPage/>}/>
      <Route path="transfer" element={<TransferPage/>}/>
      <Route path="statements" element={<StatementsPage/>}/>
      <Route path="settings" element={<SettingsPage/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
