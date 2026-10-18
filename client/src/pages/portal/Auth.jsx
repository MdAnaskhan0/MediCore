import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api, { errMsg } from '../../api';
import { patientLogin } from '../../store';

const Field = ({ label, req, ...p }) => (
  <label className="block"><span className="mb-1 block text-sm font-semibold">{label}{req && <span className="text-red-500"> *</span>}</span><input className="input" {...p} /></label>
);

export function PortalLogin() {
  const dispatch = useDispatch(), navigate = useNavigate(), loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' }); const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try { const { data } = await api.post('/public/login', f); dispatch(patientLogin(data)); toast.success(`Welcome, ${data.user.name}`); navigate(loc.state?.from || '/portal/dashboard', { replace: true }); }
    catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4">
      <h1 className="text-3xl font-extrabold text-ink-900">Patient sign in</h1>
      <Field label="Email" type="email" required autoFocus value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
      <Field label="Password" type="password" required value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <p className="text-center text-sm text-slate-500">New here? <Link to="/portal/register" className="font-semibold text-brand-700 hover:underline">Create an account</Link> or <Link to="/portal/book" className="font-semibold text-brand-700 hover:underline">book as a guest</Link></p>
    </form>
  );
}

export function PortalRegister() {
  const dispatch = useDispatch(), navigate = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', age: '', gender: '', blood_group: '', address: '' });
  const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try {
      await api.post('/public/register', f);
      const { data } = await api.post('/public/login', { email: f.email, password: f.password });
      dispatch(patientLogin(data)); toast.success('Account created. Welcome!'); navigate('/portal/dashboard');
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold text-ink-900">Create your patient account</h1>
      <p className="mb-6 mt-1 text-slate-600">Book visits, read test results and see your history online. Already registered? <Link to="/portal/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link></p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" req value={f.name} onChange={set('name')} required />
        <Field label="Phone" type="tel" value={f.phone} onChange={set('phone')} />
        <Field label="Email" req type="email" value={f.email} onChange={set('email')} required />
        <Field label="Password (at least 6 characters)" req type="password" minLength={6} value={f.password} onChange={set('password')} required autoComplete="new-password" />
        <Field label="Age" type="number" min="0" value={f.age} onChange={set('age')} />
        <label><span className="mb-1 block text-sm font-semibold">Gender</span><select className="input" value={f.gender} onChange={set('gender')}><option value="">Select…</option><option>Male</option><option>Female</option><option>Other</option></select></label>
        <label><span className="mb-1 block text-sm font-semibold">Blood group</span><select className="input" value={f.blood_group} onChange={set('blood_group')}><option value="">Select…</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b}>{b}</option>)}</select></label>
        <Field label="Address" value={f.address} onChange={set('address')} />
      </div>
      <button className="btn-primary mt-6 !px-8 !py-3" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
    </form>
  );
}
