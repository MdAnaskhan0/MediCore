import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiUsers, FiActivity, FiCalendar, FiAlertTriangle, FiTrendingUp, FiTrendingDown, FiDollarSign, FiClipboard } from 'react-icons/fi';
import api, { errMsg, money } from '../api';
import Badge from '../components/Badge';
import { navGroups, canSee } from '../config/pages';

const Stat = ({ icon: I, label, value, tone = 'brand' }) => (
  <div className="card flex items-center gap-4 p-5">
    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${tone === 'red' ? 'bg-red-50 text-red-600' : tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-600'}`}><I size={22} /></span>
    <div className="min-w-0"><p className="truncate text-2xl font-extrabold text-ink-900">{value}</p><p className="text-sm text-slate-500">{label}</p></div>
  </div>
);

export default function Dashboard() {
  const user = useSelector(s => s.auth.user);
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/dashboard').then(r => setD(r.data)).catch(e => toast.error(errMsg(e))); }, []);

  const max = Math.max(1, ...(d?.trend || []).map(t => t.amount));
  const s = d?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">Hello, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <section aria-label="Real-time statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={FiUsers} label="Registered patients" value={s?.patients ?? '…'} />
        <Stat icon={FiActivity} label="Active doctors" value={s?.doctors ?? '…'} />
        <Stat icon={FiCalendar} label="Appointments today" value={s?.appointmentsToday ?? '…'} />
        <Stat icon={FiClipboard} label="Bills created today" value={s?.ordersToday ?? '…'} />
        <Stat icon={FiDollarSign} label="Collected today" value={s ? money(s.todayCollection) : '…'} />
        <Stat icon={FiTrendingUp} label="Income this month" value={s ? money(s.monthIncome) : '…'} />
        <Stat icon={FiTrendingDown} label="Expense this month" value={s ? money(s.monthExpense) : '…'} tone="amber" />
        <Stat icon={FiAlertTriangle} label="Outstanding patient dues" value={s ? money(s.totalDue) : '…'} tone="red" />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <h2 className="font-bold text-ink-900">Collections, last 7 days</h2>
          <div className="mt-5 flex h-48 items-end gap-3">
            {(d?.trend || []).map(t => (
              <div key={t.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold text-slate-500">{t.amount ? Math.round(t.amount).toLocaleString() : ''}</span>
                <div className="w-full max-w-12 rounded-t-md bg-brand-500" style={{ height: `${Math.max((t.amount / max) * 100, 2)}%` }} title={money(t.amount)} />
                <span className="text-xs text-slate-500">{new Date(t.date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short' })}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-bold text-ink-900">Needs attention</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between"><span>Medicines at or below reorder level</span><Badge value={d?.alerts.lowStockMedicines ?? '…'} tone={d?.alerts.lowStockMedicines ? 'red' : 'green'} /></li>
            <li className="flex items-center justify-between"><span>Products at or below reorder level</span><Badge value={d?.alerts.lowStockProducts ?? '…'} tone={d?.alerts.lowStockProducts ? 'red' : 'green'} /></li>
            <li className="flex items-center justify-between"><span>Patient dues pending</span><Badge value={s ? money(s.totalDue) : '…'} tone={s?.totalDue ? 'amber' : 'green'} /></li>
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card overflow-hidden xl:col-span-2">
          <h2 className="border-b border-slate-200 px-5 py-4 font-bold text-ink-900">Latest appointments</h2>
          <div className="overflow-x-auto"><table className="w-full">
            <thead className="bg-slate-50"><tr><th className="th">Patient</th><th className="th">Doctor</th><th className="th">When</th><th className="th">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {(d?.recentAppointments || []).map(a => <tr key={a.id}><td className="td font-medium">{a.patient}</td><td className="td">{a.doctor}</td><td className="td">{a.appointment_date} {a.appointment_time?.slice(0, 5)}</td><td className="td"><Badge value={a.status} /></td></tr>)}
            </tbody>
          </table>
          {d && !d.recentAppointments.length && <p className="py-10 text-center text-sm text-slate-400">No appointments booked yet.</p>}</div>
        </section>

        <section className="card p-5">
          <h2 className="font-bold text-ink-900">Modules</h2>
          <div className="mt-4 space-y-4">
            {navGroups.map(g => { const items = g.items.filter(i => canSee(user, i.key)); return items.length ? (
              <div key={g.name}><p className="mb-1.5 text-sm font-semibold text-slate-600">{g.name}</p>
                <div className="flex flex-wrap gap-1.5">{items.slice(0, 4).map(i => <Link key={i.key} to={'/' + i.key} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700">{i.title}</Link>)}</div></div>) : null; })}
          </div>
        </section>
      </div>
    </div>
  );
}
