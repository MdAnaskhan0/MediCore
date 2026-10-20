import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const FALLBACK = [{ id: 0, title: 'Book your doctor online and skip the queue', subtitle: 'Pick a doctor, choose a free time, and we will confirm your visit. No account needed for a one-off booking.', button_text: 'Book an appointment', button_link: '/portal/book' }];

function Cta({ to, children }) {
  const cls = 'btn-primary !px-6 !py-3 text-base';
  return /^https?:/.test(to) ? <a href={to} className={cls}>{children}</a> : <Link to={to} className={cls}>{children}</Link>;
}

export default function Slider({ slides }) {
  const list = slides?.length ? slides : FALLBACK;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const go = n => setI((n + list.length) % list.length);

  useEffect(() => { if (i >= list.length) setI(0); }, [list.length, i]);
  useEffect(() => {
    if (paused || reduce || list.length < 2) return;
    const t = setInterval(() => setI(x => (x + 1) % list.length), 6000);
    return () => clearInterval(t);
  }, [paused, reduce, list.length]);

  return (
    <section aria-roledescription="carousel" aria-label="Hospital highlights"
      className="relative overflow-hidden rounded-2xl bg-ink-900"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="relative h-[360px] sm:h-[440px]">
        {list.map((s, n) => (
          <div key={s.id} role="group" aria-roledescription="slide" aria-label={`${n + 1} of ${list.length}`} aria-hidden={n !== i}
            className={`absolute inset-0 transition-opacity duration-700 ${n === i ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
            {s.image_url ? <img src={s.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              : <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-800 to-brand-700" />}
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/55 to-transparent" />
            <div className="relative flex h-full max-w-2xl flex-col justify-center gap-4 px-8 text-white sm:px-14">
              <h2 className="text-3xl font-extrabold leading-tight sm:text-5xl">{s.title}</h2>
              {s.subtitle && <p className="text-base text-slate-200 sm:text-lg">{s.subtitle}</p>}
              {s.button_text && s.button_link && <div className="pt-2" {...(n !== i ? { inert: '' } : {})}><Cta to={s.button_link}>{s.button_text}</Cta></div>}
            </div>
          </div>
        ))}
      </div>
      {list.length > 1 && <>
        <button onClick={() => go(i - 1)} aria-label="Previous slide" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur hover:bg-white/30"><FiChevronLeft size={22} /></button>
        <button onClick={() => go(i + 1)} aria-label="Next slide" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur hover:bg-white/30"><FiChevronRight size={22} /></button>
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
          {list.map((s, n) => <button key={s.id} onClick={() => setI(n)} aria-label={`Go to slide ${n + 1}`} aria-current={n === i}
            className={`h-2.5 rounded-full transition-all ${n === i ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'}`} />)}
        </div>
      </>}
    </section>
  );
}
