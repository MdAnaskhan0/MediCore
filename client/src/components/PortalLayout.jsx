import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiPlusSquare } from 'react-icons/fi';
import { patientLogout } from '../store';

export default function PortalLayout() {
  const dispatch = useDispatch(), navigate = useNavigate();
  const user = useSelector(s => s.patient.user);
  const link = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`;
  const out = () => { dispatch(patientLogout()); toast.info('You have been signed out.'); navigate('/portal'); };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/portal" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white"><FiPlusSquare size={20} /></span>
            <span className="text-lg font-extrabold text-ink-900">MediCore</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/portal/book" className={link}>Book appointment</NavLink>
            {user && <>
              <NavLink to="/portal/dashboard" className={link}>My dashboard</NavLink>
              <NavLink to="/portal/appointments" className={link}>Appointments</NavLink>
              <NavLink to="/portal/history" className={link}>Medical history</NavLink>
              <NavLink to="/portal/profile" className={link}>Profile</NavLink>
              <button onClick={out} className="btn-ghost ml-2 !py-1.5">Sign out</button>
            </>}
            {!user && <>
              <NavLink to="/portal/login" className={link}>Sign in</NavLink>
              <Link to="/portal/register" className="btn-primary ml-1 !py-1.5">Create account</Link>
            </>}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"><Outlet /></main>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} MediCore Hospital. All rights reserved.</footer>
    </div>
  );
}
