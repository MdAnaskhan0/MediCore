const TONES = ['bg-brand-100 text-brand-700', 'bg-sky-100 text-sky-700', 'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700'];
export default function DoctorAvatar({ doctor, size = 'h-16 w-16', text = 'text-xl' }) {
  if (doctor.photo_url) return <img src={doctor.photo_url} alt={doctor.name} className={`${size} shrink-0 rounded-full object-cover`} />;
  const initials = doctor.name.replace(/^dr\.?\s*/i, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return <span aria-hidden="true" className={`${size} ${text} grid shrink-0 place-items-center rounded-full font-extrabold ${TONES[doctor.id % TONES.length]}`}>{initials}</span>;
}
