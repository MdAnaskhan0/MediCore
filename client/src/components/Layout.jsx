import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiHome, FiLogOut, FiMenu, FiChevronDown, FiPlusSquare } from 'react-icons/fi';
import { logout, toggleSidebar, closeSidebar } from '../store';
import { navGroups, canSee, pages } from '../config/pages';

export default function Layout() {
  const dispatch = useDispatch(), navigate = useNavigate(), { pathname } = useLocation();
  const user = useSelector(s => s.auth.user);
  const open = useSelector(s => s.ui.sidebarOpen);
  const current = pages.find(p => '/' + p.key === pathname);
  const [openGroup, setOpenGroup] = useState(current?.group || null);

  useEffect(() => { dispatch(closeSidebar()); if (current) setOpenGroup(current.group); }, [pathname]);

  const signOut = () => { dispatch(logout()); toast.info('You have been signed out.'); navigate('/login'); };
  const link = ({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-500 text-white' : 'text-slate-300 hover:bg-ink-800 hover:text-white'}`;

  return (
    <div className="flex min-h-screen">
      {open && <div className="fixed inset-0 z-30 bg-ink-950/50 lg:hidden" onClick={() => dispatch(closeSidebar())} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-ink-900 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white"><FiPlusSquare size={20} /></span>
          <div><p className="text-lg font-extrabold leading-tight text-white">MediCore</p><p className="text-xs text-slate-400">Hospital management</p></div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <NavLink to="/" end className={link}><FiHome size={17} /> Dashboard</NavLink>
          {navGroups.map(g => {
            const items = g.items.filter(i => canSee(user, i.key));
            if (!items.length) return null;
            const isOpen = openGroup === g.name;
            return (
              <div key={g.name}>
                <button onClick={() => setOpenGroup(isOpen ? null : g.name)} aria-expanded={isOpen}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-ink-800">
                  {g.name}<FiChevronDown className={`transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && <div className="ml-3 mt-1 space-y-0.5 border-l border-ink-700 pl-3">
                  {items.map(i => <NavLink key={i.key} to={'/' + i.key} className={link}><i.icon size={16} className="shrink-0" /><span className="truncate">{i.title}</span></NavLink>)}
                </div>}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-ink-800 p-3">
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-red-500/15 hover:text-red-300"><FiLogOut size={17} /> Secure logout</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => dispatch(toggleSidebar())} aria-label="Open menu"><FiMenu size={20} /></button>
            <p className="font-semibold text-ink-900">{current?.title || 'Dashboard'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right"><p className="text-sm font-semibold leading-tight text-ink-900">{user?.name}</p><p className="text-xs text-slate-500">{user?.role}</p></div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
