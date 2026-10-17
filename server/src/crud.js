import { Router } from 'express';
import { pool } from './db.js';
import { resources } from './resources.js';

const ERR = {
  ER_DUP_ENTRY: 'This record already exists.',
  ER_NO_REFERENCED_ROW_2: 'The selected related record does not exist.',
  ER_ROW_IS_REFERENCED_2: 'This record is used elsewhere and cannot be deleted.',
  ER_BAD_NULL_ERROR: 'A required field is missing.',
};
const wrap = fn => (req, res) => fn(req, res).catch(e => {
  if (!ERR[e.code] && !e.status) console.error(e);
  res.status(e.status || (ERR[e.code] ? 400 : 500)).json({ message: ERR[e.code] || e.message });
});
const pick = (cfg, b) => Object.fromEntries(cfg.cols.filter(c => c in b).map(c => [c, b[c] === '' ? null : b[c]]));

async function applyEffects(conn, cfg, row, dir) {
  for (const e of cfg.effects || []) {
    const delta = dir * e.sign * Number(row[e.amount] || 0);
    if (!row[e.fk] || !delta) continue;
    const [r] = await conn.query(`UPDATE ${e.target} SET ${e.field} = ${e.field} + ? WHERE id = ? AND ${e.field} + ? >= 0`, [delta, row[e.fk], delta]);
    if (!r.affectedRows) throw Object.assign(new Error(`Not enough ${e.field} available for this change.`), { status: 400 });
  }
}
async function tx(fn) {
  const conn = await pool.getConnection();
  try { await conn.beginTransaction(); const out = await fn(conn); await conn.commit(); return out; }
  catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}
const getRow = async (conn, table, id, lock) => (await conn.query(`SELECT * FROM ${table} WHERE id = ? ${lock ? 'FOR UPDATE' : ''}`, [id]))[0][0];

const router = Router();
for (const [name, cfg] of Object.entries(resources)) {
  const base = `/${name}`;
  const from = `${cfg.table} t ${cfg.joins || ''}`;

  router.get(base, wrap(async (req, res) => {
    const { q = '', all } = req.query;
    const limit = all ? 5000 : Math.min(+req.query.limit || 10, 100);
    const offset = (Math.max(+req.query.page || 1, 1) - 1) * limit;
    const useQ = q && cfg.search?.length;
    const where = useQ ? `WHERE (${cfg.search.map(c => `${c} LIKE ?`).join(' OR ')})` : '';
    const p = useQ ? cfg.search.map(() => `%${q}%`) : [];
    const [[{ n }]] = await pool.query(`SELECT COUNT(*) n FROM ${from} ${where}`, p);
    const [data] = await pool.query(`SELECT ${cfg.select || 't.*'} FROM ${from} ${where} ORDER BY t.id DESC LIMIT ? OFFSET ?`, [...p, limit, offset]);
    res.json({ data, total: n });
  }));

  router.post(base, wrap(async (req, res) => {
    const id = await tx(async conn => {
      const d = pick(cfg, req.body);
      await cfg.prepare?.(d, true);
      const [r] = await conn.query(`INSERT INTO ${cfg.table} SET ?`, [d]);
      const row = await getRow(conn, cfg.table, r.insertId);
      await applyEffects(conn, cfg, row, 1);
      await cfg.after?.(conn, null, row);
      return r.insertId;
    });
    res.status(201).json({ id });
  }));

  router.put(`${base}/:id`, wrap(async (req, res) => {
    await tx(async conn => {
      const old = await getRow(conn, cfg.table, req.params.id, true);
      if (!old) throw Object.assign(new Error('Record not found'), { status: 404 });
      const d = pick(cfg, req.body);
      await cfg.prepare?.(d, false);
      await applyEffects(conn, cfg, old, -1);
      if (Object.keys(d).length) await conn.query(`UPDATE ${cfg.table} SET ? WHERE id = ?`, [d, req.params.id]);
      const row = await getRow(conn, cfg.table, req.params.id);
      await applyEffects(conn, cfg, row, 1);
      await cfg.after?.(conn, old, row);
    });
    res.json({ ok: true });
  }));

  router.delete(`${base}/:id`, wrap(async (req, res) => {
    await tx(async conn => {
      const old = await getRow(conn, cfg.table, req.params.id, true);
      if (!old) throw Object.assign(new Error('Record not found'), { status: 404 });
      await applyEffects(conn, cfg, old, -1);
      await conn.query(`DELETE FROM ${cfg.table} WHERE id = ?`, [req.params.id]);
    });
    res.json({ ok: true });
  }));
}
export default router;
