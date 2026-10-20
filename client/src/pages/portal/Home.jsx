import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiCalendar, FiFileText, FiClock, FiUser, FiAward, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api, { money } from '../../api';
import Slider from '../../components/Slider';
import DoctorAvatar from '../../components/DoctorAvatar';

const Heading = ({ id, title, sub }) => (
  <div id={id} className="mb-6 scroll-mt-24">
    <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{title}</h2>
    {sub && <p className="mt-1 text-slate-600">{sub}</p>}
  </div>
);

function Lightbox({ items, index, onClose, onMove }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') onMove(-1); if (e.key === 'ArrowRight') onMove(1); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [onClose, onMove]);
  const it = items[index];
  return (
    <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/30"><FiX size={22} /></button>
      <button onClick={() => onMove(-1)} aria-label="Previous photo" className="absolute left-3 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/30"><FiChevronLeft size={24} /></button>
      <figure className="max-h-full max-w-4xl text-center">
        <img src={it.image_url} alt={it.title || 'Hospital photo'} className="mx-auto max-h-[78vh] rounded-lg object-contain" />
        {it.title && <figcaption className="mt-3 text-white">{it.title}</figcaption>}
      </figure>
      <button onClick={() => onMove(1)} aria-label="Next photo" className="absolute right-3 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/30"><FiChevronRight size={24} /></button>
    </div>
  );
}

export default function Home() {
  const [d, setD] = useState(null);
  const [cat, setCat] = useState('All');
  const [view, setView] = useState(null);
  const { hash } = useLocation();

  useEffect(() => { api.get('/public/home').then(r => setD(r.data)).catch(() => setD({ slides: [], doctors: [], services: [], gallery: [] })); }, []);
  useEffect(() => { if (d && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }); }, [d, hash]);

  const cats = useMemo(() => ['All', ...new Set((d?.services || []).map(s => s.category || 'Other'))], [d]);
  const services = (d?.services || []).filter(s => cat === 'All' || (s.category || 'Other') === cat);
  const move = n => setView(v => (v + n + d.gallery.length) % d.gallery.length);

  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <Slider slides={d?.slides} />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 px-5 py-4">
          <p className="font-semibold text-ink-900">New here? Book without an account, or create one to follow your visits and reports.</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/portal/book" className="btn-primary !py-2">Book as a guest</Link>
            <Link to="/portal/register" className="btn-ghost !py-2">Create account</Link>
            <Link to="/portal/login" className="btn-ghost !py-2">Sign in</Link>
          </div>
        </div>
      </div>

      {d?.doctors.length > 0 && (
        <section>
          <Heading id="doctors" title="Our most popular doctors" sub="Choose a doctor and book a free time in a minute." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {d.doctors.map(dr => (
              <article key={dr.id} className="card flex flex-col items-center p-5 text-center transition hover:-translate-y-0.5 hover:shadow-md">
                <DoctorAvatar doctor={dr} size="h-24 w-24" text="text-3xl" />
                <h3 className="mt-4 font-bold text-ink-900">{dr.name}</h3>
                <p className="text-sm font-semibold text-brand-700">{dr.specialization || 'General medicine'}</p>
                {dr.qualification && <p className="mt-1 text-xs text-slate-500">{dr.qualification}</p>}
                {dr.experience_years > 0 && <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600"><FiAward /> {dr.experience_years} years experience</p>}
                {dr.bio && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{dr.bio}</p>}
                <p className="mt-3 text-sm text-slate-500">Consultation fee <span className="font-bold text-ink-900">{money(dr.fee)}</span></p>
                <Link to={`/portal/book?doctor=${dr.id}`} className="btn-primary mt-4 w-full !py-2">Book appointment</Link>
              </article>))}
          </div>
          <p className="mt-4 text-center text-sm text-slate-500">Looking for someone else? <Link to="/portal/book" className="font-semibold text-brand-700 hover:underline">Search all doctors by name or department</Link></p>
        </section>
      )}

      {d?.services.length > 0 && (
        <section>
          <Heading id="services" title="Patient services and prices" sub="Standard rates for our most requested services." />
          <div className="mb-4 flex flex-wrap gap-2">
            {cats.map(c => <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${cat === c ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{c}</button>)}
          </div>
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {services.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0"><p className="font-semibold text-ink-900">{s.name}</p>
                  <p className="truncate text-sm text-slate-500">{[s.category, s.description].filter(Boolean).join(' · ')}</p></div>
                <p className="shrink-0 text-lg font-extrabold text-brand-700">{money(s.price)}</p>
              </div>))}
          </div>
        </section>
      )}

      {d?.gallery.length > 0 && (
        <section>
          <Heading id="gallery" title="Take a look inside" sub="Our facilities, wards and laboratories." />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {d.gallery.map((g, n) => (
              <button key={g.id} onClick={() => setView(n)} aria-label={`Open photo: ${g.title || 'Hospital photo'}`}
                className="group relative overflow-hidden rounded-xl bg-slate-100">
                <img src={g.image_url} alt={g.title || ''} loading="lazy" className="h-48 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-60" />
                {g.title && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent px-4 pb-3 pt-8 text-left text-sm font-semibold text-white">{g.title}</span>}
              </button>))}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-ink-900 p-8 text-white sm:p-10">
        <h2 className="text-2xl font-extrabold">With a free patient account you can</h2>
        <ul className="mt-5 grid gap-4 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          <li className="flex gap-3"><FiCalendar className="mt-0.5 shrink-0 text-brand-500" size={18} />See and cancel your appointments</li>
          <li className="flex gap-3"><FiFileText className="mt-0.5 shrink-0 text-brand-500" size={18} />Read test results once they are completed</li>
          <li className="flex gap-3"><FiClock className="mt-0.5 shrink-0 text-brand-500" size={18} />Review visits, services and bills in one timeline</li>
          <li className="flex gap-3"><FiUser className="mt-0.5 shrink-0 text-brand-500" size={18} />Keep your contact details up to date</li>
        </ul>
        <Link to="/portal/register" className="btn-primary mt-6 !px-6 !py-3">Create my account</Link>
      </section>

      {view !== null && d.gallery[view] && <Lightbox items={d.gallery} index={view} onClose={() => setView(null)} onMove={move} />}
    </div>
  );
}
