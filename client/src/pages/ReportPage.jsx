import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiPrinter, FiDownload, FiInbox } from 'react-icons/fi';
import api, { errMsg, money } from '../api';
import Badge from '../components/Badge';

const iso = d => d.toLocaleDateString('en-CA');
const monthStart = () => { const d = new Date(); d.setDate(1); return iso(d); };

export default function ReportPage({ page }) {
  const [range, setRange] = useState({ from: monthStart(), to: iso(new Date()) });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const dueOnly = page.report === 'due';

  useEffect(() => {
    setLoading(true);
    api.get(`/reports/${page.report}`, { params: range }).then(r => setData(r.data)).catch(e => toast.error(errMsg(e))).finally(() => setLoading(false));
  }, [page.report, range]);

  const fmt = (c, v) => (c.key === 'type' ? <Badge value={v} /> : c.money ? money(v) : v ?? '—');

  const exportCsv = () => {
    const head = data.columns.map(c => c.label).join(',');
    const body = data.rows.map(r => data.columns.map(c => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([head + '\n' + body], { type: 'text/csv' }));
    a.download = `${page.report}-report.csv`; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold text-ink-900">{page.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{range.from} to {range.to}</p></div>
        <div className="no-print flex flex-wrap items-end gap-3">
          {['from', 'to'].map(k => (
            <label key={k}><span className="mb-1 block text-xs font-semibold text-slate-500">{k === 'from' ? 'From' : 'To'}</span>
              <input type="date" className="input" value={range[k]} onChange={e => setRange({ ...range, [k]: e.target.value })} /></label>))}
          <button className="btn-ghost" onClick={() => window.print()}><FiPrinter /> Print</button>
          <button className="btn-ghost" onClick={exportCsv} disabled={!data?.rows.length}><FiDownload /> Export CSV</button>
        </div>
      </div>

      {data && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.summary.map(s => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-extrabold ${s.money && s.value < 0 || (dueOnly && s.money && s.value > 0) ? 'text-red-600' : 'text-ink-900'}`}>{s.money ? money(s.value) : s.value}</p>
          </div>))}
      </div>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full">
          <thead className="bg-slate-50"><tr>{data?.columns.map(c => <th key={c.key} className={`th ${c.money ? 'text-right' : ''}`}>{c.label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {data?.rows.map((r, i) => <tr key={i} className="hover:bg-slate-50/70">{data.columns.map(c => <td key={c.key} className={`td ${c.money ? 'text-right tabular-nums' : ''}`}>{fmt(c, r[c.key])}</td>)}</tr>)}
          </tbody>
        </table></div>
        {loading && <p className="py-12 text-center text-sm text-slate-400">Loading report…</p>}
        {!loading && data && !data.rows.length && <div className="flex flex-col items-center gap-2 py-12 text-slate-400"><FiInbox size={30} /><p className="text-sm">No data for this period. Try a wider date range.</p></div>}
      </div>
    </div>
  );
}
