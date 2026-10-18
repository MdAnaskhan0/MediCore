import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from './components/Layout';
import CrudPage from './components/CrudPage';
import PortalLayout from './components/PortalLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReportPage from './pages/ReportPage';
import Home from './pages/portal/Home';
import { PortalLogin, PortalRegister } from './pages/portal/Auth';
import { GuestBook } from './pages/portal/Book';
import { PDashboard, PAppointments, PHistory, PProfile } from './pages/portal/Account';
import { pages, canSee } from './config/pages';

function PatientRoute() {
  const token = useSelector(s => s.patient.token);
  const loc = useLocation();
  return token ? <Outlet /> : <Navigate to="/portal/login" replace state={{ from: loc.pathname }} />;
}

export default function App() {
  const { token, user } = useSelector(s => s.auth);
  return (
    <Routes>
      {/* Patient portal: public pages + signed-in patient pages */}
      <Route path="/portal" element={<PortalLayout />}>
        <Route index element={<Home />} />
        <Route path="book" element={<GuestBook />} />
        <Route path="login" element={<PortalLogin />} />
        <Route path="register" element={<PortalRegister />} />
        <Route element={<PatientRoute />}>
          <Route path="dashboard" element={<PDashboard />} />
          <Route path="appointments" element={<PAppointments />} />
          <Route path="history" element={<PHistory />} />
          <Route path="profile" element={<PProfile />} />
        </Route>
      </Route>

      {/* Hospital staff */}
      {token ? (
        <>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            {pages.filter(p => canSee(user, p.key)).map(p => (
              <Route key={p.key} path={p.key} element={p.report ? <ReportPage page={p} /> : <CrudPage page={p} />} />
            ))}
            <Route path="*" element={<p className="text-slate-500">This page does not exist or you do not have access to it.</p>} />
          </Route>
        </>
      ) : (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </>
      )}
    </Routes>
  );
}
