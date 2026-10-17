import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from './components/Layout';
import CrudPage from './components/CrudPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReportPage from './pages/ReportPage';
import { pages, canSee } from './config/pages';

export default function App() {
  const { token, user } = useSelector(s => s.auth);
  if (!token) return <Routes><Route path="/login" element={<Login />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes>;
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        {pages.filter(p => canSee(user, p.key)).map(p => (
          <Route key={p.key} path={p.key} element={p.report ? <ReportPage page={p} /> : <CrudPage page={p} />} />
        ))}
        <Route path="*" element={<p className="text-slate-500">This page does not exist or you do not have access to it.</p>} />
      </Route>
    </Routes>
  );
}
