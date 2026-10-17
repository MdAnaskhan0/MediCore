import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FiPlusSquare, FiMail, FiLock } from 'react-icons/fi';
import api, { errMsg } from '../api';
import { loginSuccess } from '../store';

export default function Login() {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try { const { data } = await api.post('/auth/login', form); dispatch(loginSuccess(data)); toast.success(`Welcome back, ${data.user.name}`); }
    catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500"><FiPlusSquare size={22} /></span><span className="text-xl font-extrabold">MediCore</span></div>
        <div>
          <h1 className="max-w-md text-4xl font-extrabold leading-tight">Every patient, bill and prescription in one place.</h1>
          <p className="mt-4 max-w-md text-slate-300">Registration, billing, investigations, pharmacy stock and accounts — connected, so the front desk and the back office see the same numbers.</p>
        </div>
        <p className="text-sm text-slate-400">Authorised staff only</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h2 className="text-2xl font-extrabold text-ink-900">Sign in</h2>
          <p className="mb-6 mt-1 text-sm text-slate-500">Use the account your administrator created for you.</p>
          <label className="mb-4 block"><span className="mb-1 block text-sm font-semibold">Email</span>
            <div className="relative"><FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" type="email" required autoFocus value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@hospital.com" /></div></label>
          <label className="mb-6 block"><span className="mb-1 block text-sm font-semibold">Password</span>
            <div className="relative"><FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div></label>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
