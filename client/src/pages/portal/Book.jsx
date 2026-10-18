import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCheckCircle } from 'react-icons/fi';
import api, { errMsg, money } from '../../api';

const today = () => new Date().toLocaleDateString('en-CA');
const fmtTime = t => { const [h, m] = t.split(':'); return `${+h % 12 || 12}:${m} ${+h < 12 ? 'AM' : 'PM'}`; };

export function BookingForm({ guest, onBooked, initialDoctor = '' }) {
  const [doctors, setDoctors] = useState([]);
  const [f, setF] = useState({ doctor_id: initialDoctor, date: '', time: '', note: '', name: '', phone: '', age: '', gender: '' });
  const [slots, setSlots] = useState(null);
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => { api.get('/public/doctors').then(r => setDoctors(r.data)).catch(e => toast.error(errMsg(e))); }, []);
  useEffect(() => {
    setF(p => ({ ...p, time: '' })); setSlots(null);
    if (!f.doctor_id || !f.date) return;
    api.get('/public/slots', { params: { doctor_id: f.doctor_id, date: f.date } }).then(r => setSlots(r.data.slots)).catch(e => toast.error(errMsg(e)));
  }, [f.doctor_id, f.date, tick]);

  const submit = async e => {
    e.preventDefault();
    if (!f.doctor_id || !f.date || !f.time) return toast.warn('Choose a doctor, a date and a time.');
    if (guest && (!f.name.trim() || !f.phone.trim())) return toast.warn('Your name and phone number are required.');
    setBusy(true);
    try {
      const { data } = await api.post(guest ? '/public/appointments' : '/portal/appointments', f);
      onBooked({ id: data.id, doctor: doctors.find(d => String(d.id) === String(f.doctor_id)), date: f.date, time: f.time });
    } catch (err) { toast.error(errMsg(err)); if (err.response?.status === 409) setTick(t => t + 1); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <section>
        <h2 className="mb-3 font-bold text-ink-900">Choose a doctor</h2>
        {!doctors.length && <p className="text-sm text-slate-500">No doctors are available for online booking right now.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {doctors.map(d => (
            <button type="button" key={d.id} onClick={() => set('doctor_id', String(d.id))} aria-pressed={String(f.doctor_id) === String(d.id)}
              className={`rounded-xl border p-4 text-left transition ${String(f.doctor_id) === String(d.id) ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-500/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <p className="font-bold text-ink-900">{d.name}</p><p className="text-sm text-slate-500">{d.specialization || 'General medicine'}</p><p className="mt-1 text-sm font-semibold text-brand-700">Fee {money(d.fee)}</p>
            </button>))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-bold text-ink-900">Pick a date and time</h2>
        <input type="date" className="input max-w-xs" min={today()} value={f.date} onChange={e => set('date', e.target.value)} aria-label="Appointment date" />
        <div className="mt-4">
          {!f.doctor_id || !f.date ? <p className="text-sm text-slate-500">Select a doctor and a date to see free times.</p>
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
