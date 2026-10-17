import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, FiInbox } from 'react-icons/fi';
import api, { errMsg, money } from '../api';
import Modal from './Modal';
import Badge from './Badge';

export const tpl = (s, row) => (s.includes('{') ? s.replace(/\{(\w+)\}/g, (_, k) => row[k] ?? '') : row[s] ?? '');
const todayStr = () => new Date().toLocaleDateString('en-CA');
const LIMIT = 10;

const blank = fields => Object.fromEntries(fields.map(f => [f.name, f.default ?? (f.today ? todayStr() : '')]));

export default function CrudPage({ page }) {
  const { res, fields, extra = [], readOnly } = page;
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState({});
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const cols = useMemo(() => [
    ...extra.filter(c => c.first),
    ...fields.filter(f => !f.hide && f.type !== 'password'),
    ...extra.filter(c => !c.first),
  ], [fields, extra]);

  useEffect(() => { setPageNo(1); setQ(''); }, [page.key]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/${res}`, { params: { q, page: pageNo, limit: LIMIT } });
      setRows(data.data); setTotal(data.total);
    } catch (e) { toast.error(errMsg(e)); } finally { setLoading(false); }
  }, [res, q, pageNo]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  // load lookup lists for select fields (refreshed whenever the form opens)
  useEffect(() => {
    const targets = [...new Set(fields.filter(f => f.ref).map(f => f.ref.res))];
    Promise.all(targets.map(t => api.get(`/${t}`, { params: { all: 1 } }).then(r => [t, r.data.data])))
      .then(a => setRefs(Object.fromEntries(a))).catch(() => {});
  }, [page.key, modal]);

  const refRow = (f, id) => refs[f.ref.res]?.find(r => String(r.id) === String(id));
  const refLabel = (f, id) => { const r = refRow(f, id); return r ? tpl(f.ref.lab, r) : id; };

  const openNew = () => { setEditId(null); setForm(blank(fields)); setModal(true); };
  const openEdit = row => { setEditId(row.id); setForm({ ...blank(fields), ...Object.fromEntries(fields.map(f => [f.name, f.type === 'password' ? '' : row[f.name] ?? ''])) }); setModal(true); };

  const change = (f, value) => {
    setForm(prev => {
      const next = { ...prev, [f.name]: value };
      if (f.fill && value !== '') { const r = refRow(f, value); if (r) next[f.fill.to] = r[f.fill.from]; }
      return next;
    });
  };

  const save = async e => {
    e.preventDefault();
    const missing = fields.find(f => f.required && !(editId && f.type === 'password') && String(form[f.name] ?? '').trim() === '');
    if (missing) return toast.warn(`${missing.label} is required.`);
    setSaving(true);
    try {
      if (editId) await api.put(`/${res}/${editId}`, form); else await api.post(`/${res}`, form);
      toast.success(editId ? 'Changes saved' : 'Record added');
      setModal(false); load();
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  const remove = async row => {
    if (!window.confirm('Delete this record? Stock and balances linked to it will be reversed.')) return;
    try { await api.delete(`/${res}/${row.id}`); toast.success('Record deleted'); if (rows.length === 1 && pageNo > 1) setPageNo(pageNo - 1); else load(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  const cell = (c, row) => {
    const v = row[c.name];
    if (c.ref) return v ? refLabel(c, v) : '—';
    if (v === null || v === undefined || v === '') return '—';
    if (c.name === 'status') return <Badge value={v} />;
    if (c.stock) return Number(v) <= Number(row.reorder_level ?? -1) ? <span className="inline-flex items-center gap-2 font-semibold text-red-600">{v}<Badge value="Low" tone="red" /></span> : v;
    if (c.due) return <span className={Number(v) > 0 ? 'font-semibold text-red-600' : 'text-slate-500'}>{money(v)}</span>;
    if (c.money) return money(v);
    return v;
  };

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">{page.title}</h1>
          {page.hint && <p className="mt-1 max-w-2xl text-sm text-slate-500">{page.hint}</p>}
        </div>
        {!readOnly && <button className="btn-primary" onClick={openNew}><FiPlus /> Add new</button>}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 p-4">
          <div className="relative max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search…" value={q} onChange={e => { setQ(e.target.value); setPageNo(1); }} aria-label="Search" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50"><tr>
              <th className="th">#</th>
              {cols.map(c => <th key={c.name} className="th">{c.label}</th>)}
              {!readOnly && <th className="th text-right">Actions</th>}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, i) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="td text-slate-400">{(pageNo - 1) * LIMIT + i + 1}</td>
                  {cols.map(c => <td key={c.name} className="td">{cell(c, row)}</td>)}
                  {!readOnly && (
                    <td className="td text-right">
                      <button onClick={() => openEdit(row)} aria-label="Edit" className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-700"><FiEdit2 /></button>
                      <button onClick={() => remove(row)} aria-label="Delete" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><FiTrash2 /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !rows.length && (
            <div className="flex flex-col items-center gap-2 py-14 text-slate-400"><FiInbox size={32} />
              <p className="text-sm">{q ? 'No records match your search.' : readOnly ? 'Nothing to show yet.' : 'No records yet. Use “Add new” to create the first one.'}</p></div>
          )}
          {loading && !rows.length && <p className="py-14 text-center text-sm text-slate-400">Loading…</p>}
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
          <span>{total} record{total === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <button className="btn-ghost !px-2 !py-1.5" disabled={pageNo <= 1} onClick={() => setPageNo(pageNo - 1)} aria-label="Previous page"><FiChevronLeft /></button>
            <span>Page {pageNo} of {pages}</span>
            <button className="btn-ghost !px-2 !py-1.5" disabled={pageNo >= pages} onClick={() => setPageNo(pageNo + 1)} aria-label="Next page"><FiChevronRight /></button>
          </div>
        </div>
      </div>

      {modal && (
        <Modal title={`${editId ? 'Edit' : 'Add'} · ${page.title}`} onClose={() => setModal(false)}>
          <form onSubmit={save}>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              {fields.map(f => (
                <label key={f.name} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <span className="mb-1 block text-sm font-semibold text-slate-700">{f.label}{f.required && !(editId && f.type === 'password') && <span className="text-red-500"> *</span>}</span>
                  {f.type === 'select' ? (
                    <select className="input" value={form[f.name] ?? ''} onChange={e => change(f, e.target.value)}>
                      <option value="">Select…</option>
                      {f.ref ? (refs[f.ref.res] || []).map(r => <option key={r.id} value={r.id}>{tpl(f.ref.lab, r)}</option>)
                        : f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea rows={3} className="input" value={form[f.name] ?? ''} onChange={e => change(f, e.target.value)} />
                  ) : (
                    <input className="input" type={f.type} step={f.step} min={f.min} max={f.max} placeholder={f.placeholder} autoComplete={f.type === 'password' ? 'new-password' : undefined}
                      value={form[f.name] ?? ''} onChange={e => change(f, e.target.value)} />
                  )}
                  {editId && f.hintEdit && <span className="mt-1 block text-xs text-slate-500">{f.hintEdit}</span>}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button type="button" className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editId ? 'Save changes' : 'Add record'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
