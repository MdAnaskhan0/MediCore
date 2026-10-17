const TONES = {
  green: ['Active', 'Completed', 'Delivered', 'Approved', 'Income'],
  blue: ['Scheduled', 'In progress'],
  amber: ['Pending', 'On leave'],
  red: ['Inactive', 'Cancelled', 'Rejected', 'Resigned', 'Expense'],
};
const CLS = { green: 'bg-emerald-50 text-emerald-700', blue: 'bg-sky-50 text-sky-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', gray: 'bg-slate-100 text-slate-600' };

export default function Badge({ value, tone }) {
  const t = tone || Object.keys(TONES).find(k => TONES[k].includes(value)) || 'gray';
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${CLS[t]}`}>{value}</span>;
}
