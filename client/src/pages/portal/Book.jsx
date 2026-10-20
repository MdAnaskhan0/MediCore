import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiSearch } from 'react-icons/fi';
import DoctorAvatar from '../../components/DoctorAvatar';
import api, { errMsg, money } from '../../api';

const today = () => new Date().toLocaleDateString('en-CA');
const fmtTime = t => { const [h, m] = t.split(':'); return `${+h % 12 || 12}:${m} ${+h < 12 ? 'AM' : 'PM'}`; };

function DoctorPicker({ doctor, onPick, initialId }) {
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const [depts, setDepts] = useState([]);
  const [list, setList] = useState(null);

  useEffect(() => { api.get('/public/departments').then(r => setDepts(r.data)).catch(() => {}); }, []);
  useEffect(() => { // doctor chosen from the home page
    if (initialId) api.get('/public/doctors', { params: { id: initialId } }).then(r => r.data[0] && onPick(r.data[0])).catch(() => {});
  }, [initialId]);
  useEffect(() => {
    if (doctor) return;
    setList(null);
    const t = setTimeout(() => api.get('/public/doctors', { params: { q, department: dept } }).then(r => setList(r.data)).catch(e => toast.error(errMsg(e))), 250);
    return () => clearTimeout(t);
  }, [q, dept, doctor]);

  if (doctor) return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-600 bg-brand-50 p-4">
      <div className="flex items-center gap-4"><DoctorAvatar doctor={doctor} />
        <div><p className="font-bold text-ink-900">{doctor.name}</p><p className="text-sm text-slate-600">{doctor.specialization || 'General medicine'}</p><p className="text-sm font-semibold text-brand-700">Fee {money(doctor.fee)}</p></div></div>
      <button type="button" className="btn-ghost !py-1.5" onClick={() => onPick(null)}>Change doctor</button>
    </div>
  );

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className="mb-1 block text-sm font-semibold text-slate-700">Doctor name</span>
          <div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Type a name, e.g. Rahim" value={q} onChange={e => setQ(e.target.value)} autoComplete="off" /></div></label>
        <label><span className="mb-1 block text-sm font-semibold text-slate-700">Department</span>
          <select className="input" value={dept} onChange={e => setDept(e.target.value)}>
            <option value="">All departments</option>
            {depts.map(d => <option key={d.name} value={d.name}>{d.name} ({d.doctors})</option>)}
          </select></label>
      </div>
      <p className="mb-2 mt-4 text-sm text-slate-500" aria-live="polite">{list ? `${list.length}${list.length === 30 ? '+' : ''} doctor${list.length === 1 ? '' : 's'} found. Select one to continue.` : 'Searching…'}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {list?.map(d => (
          <button type="button" key={d.id} onClick={() => onPick(d)} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-brand-500 hover:shadow-sm">
            <DoctorAvatar doctor={d} size="h-14 w-14" text="text-lg" />
            <span className="min-w-0"><span className="block truncate font-bold text-ink-900">{d.name}</span>
              <span className="block truncate text-sm text-slate-500">{d.specialization || 'General medicine'}{d.experience_years ? ` · ${d.experience_years} yrs` : ''}</span>
              <span className="block text-sm font-semibold text-brand-700">Fee {money(d.fee)}</span></span>
          </button>))}
      </div>
      {list && !list.length && <p className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">No doctor matches. Try a shorter name or choose another department.</p>}
    </div>
  );
}

export function BookingForm({ guest, onBooked, initialDoctor = '' }) {
  const [doctor, setDoctor] = useState(null);
  const [f, setF] = useState({ date: '', time: '', note: '', name: '', phone: '', age: '', gender: '' });
  const [slots, setSlots] = useState(null);
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    setF(p => ({ ...p, time: '' })); setSlots(null);
    if (!doctor || !f.date) return;
    api.get('/public/slots', { params: { doctor_id: doctor.id, date: f.date } }).then(r => setSlots(r.data.slots)).catch(e => toast.error(errMsg(e)));
  }, [doctor, f.date, tick]);

  const submit = async e => {
    e.preventDefault();
    if (!doctor || !f.date || !f.time) return toast.warn('Choose a doctor, a date and a time.');
    if (guest && (!f.name.trim() || !f.phone.trim())) return toast.warn('Your name and phone number are required.');
    setBusy(true);
    try {
      const { data } = await api.post(guest ? '/public/appointments' : '/portal/appointments', { ...f, doctor_id: doctor.id });
      onBooked({ id: data.id, doctor, date: f.date, time: f.time });
    } catch (err) { toast.error(errMsg(err)); if (err.response?.status === 409) setTick(t => t + 1); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <section>
        <h2 className="mb-3 font-bold text-ink-900">Find your doctor</h2>
        <DoctorPicker doctor={doctor} onPick={setDoctor} initialId={initialDoctor} />
      </section>

      <section>
        <h2 className="mb-3 font-bold text-ink-900">Pick a date and time</h2>
        <input type="date" className="input max-w-xs" min={today()} value={f.date} onChange={e => set('date', e.target.value)} aria-label="Appointment date" />
        <div className="mt-4">
          {!doctor || !f.date ? <p className="text-sm text-slate-500">Select a doctor and a date to see free times.</p>
            : !slots ? <p className="text-sm text-slate-500">Loading times…</p>
            : !slots.some(s => s.available) ? <p className="text-sm font-medium text-amber-700">No free times on this date. Please try another day.</p>
            : <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {slots.map(s => (
                  <button type="button" key={s.time} disabled={!s.available} onClick={() => set('time', s.time)} aria-pressed={f.time === s.time}
                    className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${f.time === s.time ? 'border-brand-600 bg-brand-600 text-white' : s.available ? 'border-slate-300 bg-white text-slate-700 hover:border-brand-500' : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through'}`}>
                    {fmtTime(s.time)}</button>))}
              </div>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-bold text-ink-900">{guest ? 'Your details' : 'Reason for visit'}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {guest && <>
            <label><span className="mb-1 block text-sm font-semibold">Full name <span className="text-red-500">*</span></span><input className="input" value={f.name} onChange={e => set('name', e.target.value)} /></label>
            <label><span className="mb-1 block text-sm font-semibold">Phone number <span className="text-red-500">*</span></span><input className="input" type="tel" value={f.phone} onChange={e => set('phone', e.target.value)} /></label>
            <label><span className="mb-1 block text-sm font-semibold">Age</span><input className="input" type="number" min="0" value={f.age} onChange={e => set('age', e.target.value)} /></label>
            <label><span className="mb-1 block text-sm font-semibold">Gender</span>
              <select className="input" value={f.gender} onChange={e => set('gender', e.target.value)}><option value="">Select…</option><option>Male</option><option>Female</option><option>Other</option></select></label>
          </>}
          <label className="sm:col-span-2"><span className="mb-1 block text-sm font-semibold">Tell the doctor briefly why you are coming (optional)</span><textarea rows={2} className="input" value={f.note} onChange={e => set('note', e.target.value)} /></label>
        </div>
      </section>

      <button className="btn-primary !px-8 !py-3" disabled={busy}>{busy ? 'Booking…' : 'Request appointment'}</button>
    </form>
  );
}

export function Confirmation({ b, guest, again }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
      <FiCheckCircle className="mx-auto text-emerald-600" size={44} />
      <h2 className="mt-3 text-2xl font-extrabold text-ink-900">Appointment requested</h2>
      <p className="mt-1 text-slate-600">Reference <span className="font-bold">APT-{b.id}</span></p>
      <p className="mt-4 font-semibold text-ink-900">{b.doctor?.name}</p>
      <p className="text-slate-600">{new Date(b.date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at {fmtTime(b.time)}</p>
      <p className="mt-4 text-sm text-slate-600">{guest ? 'Our team will confirm this visit by phone. Keep your reference number handy and arrive 10 minutes early.' : 'Our team will confirm shortly. You can follow the status under Appointments.'}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {!guest && <Link to="/portal/appointments" className="btn-primary">View my appointments</Link>}
        <button className="btn-ghost" onClick={again}>Book another</button>
        {guest && <Link to="/portal/register" className="btn-primary">Create an account to track visits</Link>}
      </div>
    </div>
  );
}

export function GuestBook() {
  const [done, setDone] = useState(null);
  const [sp] = useSearchParams();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold text-ink-900">Book an appointment</h1>
      <p className="mb-7 mt-1 text-slate-600">No account needed. Already a patient here? <Link to="/portal/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link> to book faster.</p>
      {done ? <Confirmation b={done} guest again={() => setDone(null)} /> : <BookingForm guest initialDoctor={sp.get('doctor') || ''} onBooked={setDone} />}
    </div>
  );
}
