import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiFileText, FiClock, FiUser } from 'react-icons/fi';
import api, { money } from '../../api';

export default function Home() {
  const [docs, setDocs] = useState([]);
  useEffect(() => { api.get('/public/doctors').then(r => setDocs(r.data)).catch(() => {}); }, []);
  return (
    <div className="space-y-14">
      <section className="grid items-center gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h1 className="text-4xl font-extrabold leading-tight text-ink-900 sm:text-5xl">Book your doctor online and skip the queue at the counter.</h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">Pick a doctor, choose a time that is free, and we will confirm your visit. No account is needed for a one-off booking.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/portal/book" className="btn-primary !px-6 !py-3 text-base">Book as a guest</Link>
            <Link to="/portal/register" className="btn-ghost !px-6 !py-3 text-base">Create a patient account</Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">Already registered? <Link to="/portal/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link></p>
        </div>
        <div className="rounded-2xl bg-ink-900 p-7 text-white lg:col-span-2">
          <p className="text-lg font-bold">With a patient account you can</p>
          <ul className="mt-5 space-y-4 text-sm text-slate-200">
            <li className="flex gap-3"><FiCalendar className="mt-0.5 shrink-0 text-brand-500" size={18} />See and cancel your appointments</li>
            <li className="flex gap-3"><FiFileText className="mt-0.5 shrink-0 text-brand-500" size={18} />Read your test results as soon as they are completed</li>
            <li className="flex gap-3"><FiClock className="mt-0.5 shrink-0 text-brand-500" size={18} />Review every visit, service and bill in one timeline</li>
            <li className="flex gap-3"><FiUser className="mt-0.5 shrink-0 text-brand-500" size={18} />Keep your contact details up to date</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-extrabold text-ink-900">Our doctors</h2>
        {!docs.length ? <p className="mt-3 text-slate-500">Doctor list will appear here once the hospital adds its doctors.</p> : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map(d => (
              <div key={d.id} className="card flex items-center justify-between gap-3 p-5">
                <div><p className="font-bold text-ink-900">{d.name}</p><p className="text-sm text-slate-500">{d.specialization || 'General medicine'}</p><p className="mt-1 text-sm font-semibold text-brand-700">Fee {money(d.fee)}</p></div>
                <Link to={`/portal/book?doctor=${d.id}`} className="btn-ghost !py-1.5">Book</Link>
              </div>))}
          </div>)}
      </section>
    </div>
  );
}
