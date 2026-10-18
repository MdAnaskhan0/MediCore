import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiCalendar, FiClipboard, FiFileText, FiPrinter } from 'react-icons/fi';
import api, { errMsg, money } from '../../api';
import Badge from '../../components/Badge';
import { BookingForm, Confirmation } from './Book';

const today = () => new Date().toLocaleDateString('en-CA');
const longDate = d => new Date(d + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const hhmm = t => (t || '').slice(0, 5);
const cancellable = a => ['Requested', 'Scheduled'].includes(a.status) && a.appointment_date >= today();

function useLoad(path) {
  const [data, setData] = useState(null);
  const load = useCallback(() => api.get(path).then(r => setData(r.data)).catch(e => toast.error(errMsg(e))), [path]);
  useEffect(() => { load(); }, [load]);
  return [data, load];
}

function ApptCard({ a, onCancel }) {
  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
      <div><p className="font-bold text-ink-900">{a.doctor}<span className="font-normal text-slate-500"> · {a.specialization || 'General medicine'}</span></p>
        <p className="text-sm text-slate-600">{longDate(a.appointment_date)} at {hhmm(a.appointment_time)}</p>
        {a.note && <p className="mt-1 text-sm text-slate-500">{a.note}</p>}</div>
      <div className="flex items-center gap-3"><Badge value={a.status} />
        {onCancel && cancellable(a) && <button className="btn-ghost !py-1.5 !text-red-600" onClick={() => onCancel(a)}>Cancel</button>}</div>
    </div>
  );
}

const cancelAppt = async (a, reload) => {
  if (!window.confirm('Cancel this appointment?')) return;
  try { await api.put(`/portal/appointments/${a.id}/cancel`); toast.success('Appointment cancelled'); reload(); } catch (e) { toast.error(errMsg(e)); }
};

export function PDashboard() {
  const user = useSelector(s => s.patient.user);
  const [appts, reload] = useLoad('/portal/appointments');
  const [hist] = useLoad('/portal/history');
  const next = (appts || []).filter(a => a.appointment_date >= today() && a.status !== 'Cancelled' && a.status !== 'Completed').sort((a, b) => (a.appointment_date + a.appointment_time).localeCompare(b.appointment_date + b.appointment_time))[0];
  const due = (hist?.bills || []).reduce((s, b) => s + Number(b.due), 0);
  const ready = (hist?.tests || []).filter(t => t.status === 'Completed').length;
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold text-ink-900">Hello, {user.name.split(' ')[0]}</h1><p className="text-slate-500">Patient ID {user.patient_code}</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-slate-500">Upcoming appointment</p><p className="mt-1 font-bold text-ink-900">{next ? `${longDate(next.appointment_date)}, ${hhmm(next.appointment_time)}` : 'None booked'}</p>{next && <p className="text-sm text-slate-500">{next.doctor}</p>}</div>
        <div className="card p-5"><p className="text-sm text-slate-500">Test reports ready</p><p className="mt-1 text-2xl font-extrabold text-ink-900">{hist ? ready : '…'}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Outstanding balance</p><p className={`mt-1 text-2xl font-extrabold ${due > 0 ? 'text-red-600' : 'text-ink-900'}`}>{hist ? money(due) : '…'}</p></div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link to="/portal/appointments" className="btn-primary"><FiCalendar /> Book an appointment</Link>
        <Link to="/portal/history" className="btn-ghost"><FiClipboard /> View medical history</Link>
      </div>
      {next && <section><h2 className="mb-3 font-bold text-ink-900">Next visit</h2><ApptCard a={next} onCancel={a => cancelAppt(a, reload)} /></section>}
    </div>
  );
}

export function PAppointments() {
  const [appts, reload] = useLoad('/portal/appointments');
  const [booking, setBooking] = useState(false);
  const [done, setDone] = useState(null);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-ink-900">Appointments</h1>
        {!booking && !done && <button className="btn-primary" onClick={() => setBooking(true)}>Book new appointment</button>}
      </div>
      {done ? <Confirmation b={done} again={() => { setDone(null); setBooking(true); }} />
        : booking ? <div className="card p-6"><BookingForm onBooked={b => { setBooking(false); setDone(b); reload(); }} /><button className="btn-ghost mt-4" onClick={() => setBooking(false)}>Close</button></div> : null}
      <div className="space-y-3">
        {appts?.map(a => <ApptCard key={a.id} a={a} onCancel={a => cancelAppt(a, reload)} />)}
        {appts && !appts.length && <p className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">You have no appointments yet.</p>}
      </div>
    </div>
  );
}

export function PHistory() {
  const [appts] = useLoad('/portal/appointments');
  const [hist] = useLoad('/portal/history');
  const [tab, setTab] = useState('all');

  const items = useMemo(() => {
    if (!appts || !hist) return null;
    const billDate = id => hist.bills.find(b => b.id === id)?.order_date || '';
    return [
      ...appts.map(a => ({ type: 'visit', date: a.appointment_date, key: 'a' + a.id, title: `Appointment with ${a.doctor}`, sub: [a.specialization, hhmm(a.appointment_time), a.note].filter(Boolean).join(' · '), status: a.status })),
      ...hist.bills.map(b => ({ type: 'bill', date: b.order_date, key: 'b' + b.id, title: b.service, sub: [b.category, b.doctor && `Dr. ${b.doctor}`].filter(Boolean).join(' · '), bill: b })),
      ...hist.tests.map(t => ({ type: 'test', date: t.sample_date || billDate(t.order_id), key: 't' + t.id, title: t.test_name, sub: 'Investigation', status: t.status, result: t.result })),
    ].sort((x, y) => y.date.localeCompare(x.date));
  }, [appts, hist]);

  const shown = (items || []).filter(i => tab === 'all' || i.type === tab);
  const TABS = [['all', 'Everything'], ['visit', 'Visits'], ['bill', 'Services & bills'], ['test', 'Test reports']];
  const ICON = { visit: FiCalendar, bill: FiClipboard, test: FiFileText };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-ink-900">Medical history</h1>
        <button className="btn-ghost no-print" onClick={() => window.print()}><FiPrinter /> Print</button>
      </div>
      <div className="no-print mb-6 flex flex-wrap gap-2">
        {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{l}</button>)}
      </div>
      {!items && <p className="text-slate-500">Loading your history…</p>}
      {items && !shown.length && <p className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">Nothing here yet. Visits, bills and test reports will show up as the hospital records them.</p>}
      <ol className="relative space-y-4 border-l-2 border-slate-200 pl-6">
        {shown.map(i => { const I = ICON[i.type]; return (
          <li key={i.key} className="relative">
            <span className="absolute -left-[37px] grid h-7 w-7 place-items-center rounded-full bg-brand-50 text-brand-700 ring-4 ring-white"><I size={14} /></span>
            <div className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="font-bold text-ink-900">{i.title}</p><p className="text-sm text-slate-500">{i.date ? longDate(i.date) : ''}{i.sub ? ` · ${i.sub}` : ''}</p></div>
                {i.status && <Badge value={i.status} />}
              </div>
              {i.bill && <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                {[['Amount', i.bill.amount], ['Discount', i.bill.discount], ['Paid', i.bill.paid], ['Due', i.bill.due]].map(([l, v]) => <div key={l}><dt className="text-slate-500">{l}</dt><dd className={`font-semibold ${l === 'Due' && Number(v) > 0 ? 'text-red-600' : 'text-ink-900'}`}>{money(v)}</dd></div>)}</dl>}
              {i.type === 'test' && (i.result ? <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><span className="font-semibold">Result: </span>{i.result}</p>
                : <p className="mt-3 text-sm text-slate-500">{i.status === 'Completed' ? 'The report is ready. Please collect it from the hospital.' : 'Result will appear here once the test is completed.'}</p>)}
            </div>
          </li>); })}
      </ol>
    </div>
  );
}

export function PProfile() {
  const [me, reload] = useLoad('/portal/me');
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (me) setF(me); }, [me]);
  if (!f) return <p className="text-slate-500">Loading…</p>;
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const save = async e => {
    e.preventDefault(); setBusy(true);
    try { await api.put('/portal/me', f); toast.success('Profile updated'); reload(); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  const T = (label, k, p = {}) => <label><span className="mb-1 block text-sm font-semibold">{label}</span><input className="input" value={f[k] ?? ''} onChange={set(k)} {...p} /></label>;
  return (
    <form onSubmit={save} className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-extrabold text-ink-900">Profile</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {T('Patient ID', 'patient_code', { disabled: true })}{T('Email', 'email', { disabled: true })}
        {T('Full name', 'name', { required: true })}{T('Phone', 'phone', { type: 'tel' })}
        {T('Age', 'age', { type: 'number', min: 0 })}
        <label><span className="mb-1 block text-sm font-semibold">Gender</span><select className="input" value={f.gender ?? ''} onChange={set('gender')}><option value="">Select…</option><option>Male</option><option>Female</option><option>Other</option></select></label>
        <label><span className="mb-1 block text-sm font-semibold">Blood group</span><select className="input" value={f.blood_group ?? ''} onChange={set('blood_group')}><option value="">Select…</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b}>{b}</option>)}</select></label>
        {T('Address', 'address')}
      </div>
      <button className="btn-primary mt-6" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}
