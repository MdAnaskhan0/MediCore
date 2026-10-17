import { Router } from 'express';
import { pool } from './db.js';
import { INC, EXP, totals, series } from './finance.js';

const r = Router();
const day = d => d.toLocaleDateString('en-CA');
const one = async (sql, p = []) => (await pool.query(sql, p))[0][0];
const sum = a => a.reduce((s, x) => s + x.amount, 0);

r.get('/dashboard', async (req, res, next) => { try {
  const today = day(new Date()), monthStart = today.slice(0, 8) + '01';
  const wk = new Date(); wk.setDate(wk.getDate() - 6);
  const [pt, dr, ap, lowMed, lowProd, due, tInc, mInc, mExp, trend, recent, services] = await Promise.all([
    one('SELECT COUNT(*) n FROM patients'), one("SELECT COUNT(*) n FROM doctors WHERE status = 'Active'"),
    one('SELECT COUNT(*) n FROM appointments WHERE appointment_date = ?', [today]),
    one('SELECT COUNT(*) n FROM medicines WHERE stock <= reorder_level'), one('SELECT COUNT(*) n FROM products WHERE stock <= reorder_level'),
    one('SELECT COALESCE(SUM(due),0) n FROM service_orders WHERE due > 0'),
    totals(INC, today, today), totals(INC, monthStart, today), totals(EXP, monthStart, today),
    series(INC, '%Y-%m-%d', day(wk), today),
    pool.query(`SELECT a.id, p.name patient, d.name doctor, a.appointment_date, a.appointment_time, a.status FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN doctors d ON d.id=a.doctor_id ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT 6`).then(x => x[0]),
    one('SELECT COUNT(*) n FROM service_orders WHERE order_date = ?', [today]),
  ]);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(wk); d.setDate(wk.getDate() + i); const k = day(d); return { date: k, amount: trend[k] || 0 }; });
  res.json({
    stats: { patients: pt.n, doctors: dr.n, appointmentsToday: ap.n, ordersToday: services.n, totalDue: Number(due.n), todayCollection: sum(tInc), monthIncome: sum(mInc), monthExpense: sum(mExp) },
    alerts: { lowStockMedicines: lowMed.n, lowStockProducts: lowProd.n }, trend: days, recentAppointments: recent,
  });
} catch (e) { next(e); } });

const REPORTS = {
  async 'income-expense'(from, to) {
    const [inc, exp] = await Promise.all([totals(INC, from, to), totals(EXP, from, to)]);
    const rows = [...inc.map(x => ({ type: 'Income', ...x })), ...exp.map(x => ({ type: 'Expense', ...x }))];
    const i = sum(inc), e = sum(exp);
    return { summary: [{ label: 'Total income', value: i, money: true }, { label: 'Total expense', value: e, money: true }, { label: 'Net result', value: i - e, money: true }],
      columns: [{ key: 'type', label: 'Type' }, { key: 'category', label: 'Category' }, { key: 'amount', label: 'Amount', money: true }], rows };
  },
  async financial(from, to) {
    const [inc, exp] = await Promise.all([series(INC, '%Y-%m', from, to), series(EXP, '%Y-%m', from, to)]);
    const rows = [...new Set([...Object.keys(inc), ...Object.keys(exp)])].sort().map(m => ({ month: m, income: inc[m] || 0, expense: exp[m] || 0, net: (inc[m] || 0) - (exp[m] || 0) }));
    const I = rows.reduce((s, x) => s + x.income, 0), E = rows.reduce((s, x) => s + x.expense, 0);
    return { summary: [{ label: 'Income', value: I, money: true }, { label: 'Expense', value: E, money: true }, { label: 'Profit / loss', value: I - E, money: true }],
      columns: [{ key: 'month', label: 'Month' }, { key: 'income', label: 'Income', money: true }, { key: 'expense', label: 'Expense', money: true }, { key: 'net', label: 'Net', money: true }], rows };
  },
  async collection(from, to) {
    const [rows] = await pool.query(`
      SELECT * FROM (
        SELECT o.order_date date, 'Patient service' source, CONCAT('Bill #', o.id) ref, p.name party, o.paid amount FROM service_orders o JOIN patients p ON p.id=o.patient_id WHERE o.paid > 0
        UNION ALL SELECT c.collected_on, 'Due collection', CONCAT('Bill #', c.order_id), p.name, c.amount FROM due_collections c JOIN service_orders o ON o.id=c.order_id JOIN patients p ON p.id=o.patient_id
        UNION ALL SELECT s.sale_date, 'Medicine sale', CONCAT('Sale #', s.id), s.customer_name, s.total FROM medicine_sales s
      ) x WHERE date BETWEEN ? AND ? ORDER BY date DESC`, [from, to]);
    return { summary: [{ label: 'Total collected', value: rows.reduce((s, x) => s + Number(x.amount), 0), money: true }, { label: 'Entries', value: rows.length }],
      columns: [{ key: 'date', label: 'Date' }, { key: 'source', label: 'Source' }, { key: 'ref', label: 'Reference' }, { key: 'party', label: 'Patient / customer' }, { key: 'amount', label: 'Amount', money: true }], rows };
  },
  async due(from, to) {
    const [rows] = await pool.query(`SELECT o.id, p.name patient, p.phone, s.name service, o.order_date, o.amount, o.discount, (o.paid + o.collected) paid, o.due
      FROM service_orders o JOIN patients p ON p.id=o.patient_id JOIN services s ON s.id=o.service_id WHERE o.due > 0 AND o.order_date BETWEEN ? AND ? ORDER BY o.due DESC`, [from, to]);
    return { summary: [{ label: 'Outstanding due', value: rows.reduce((s, x) => s + Number(x.due), 0), money: true }, { label: 'Bills with due', value: rows.length }],
      columns: [{ key: 'id', label: 'Bill #' }, { key: 'patient', label: 'Patient' }, { key: 'phone', label: 'Phone' }, { key: 'service', label: 'Service' }, { key: 'order_date', label: 'Date' },
        { key: 'amount', label: 'Amount', money: true }, { key: 'discount', label: 'Discount', money: true }, { key: 'paid', label: 'Paid', money: true }, { key: 'due', label: 'Due', money: true }], rows };
  },
  async medicine(from, to) {
    const [rows] = await pool.query(`SELECT m.name, m.stock, COALESCE(pu.q,0) purchased, COALESCE(sa.q,0) sold, COALESCE(pu.v,0) purchase_value, COALESCE(sa.v,0) sales_value
      FROM medicines m
      LEFT JOIN (SELECT medicine_id, SUM(qty) q, SUM(total) v FROM medicine_purchases WHERE purchase_date BETWEEN ? AND ? GROUP BY medicine_id) pu ON pu.medicine_id = m.id
      LEFT JOIN (SELECT medicine_id, SUM(qty) q, SUM(total) v FROM medicine_sales WHERE sale_date BETWEEN ? AND ? GROUP BY medicine_id) sa ON sa.medicine_id = m.id
      ORDER BY sold DESC, m.name`, [from, to, from, to]);
    const S = k => rows.reduce((s, x) => s + Number(x[k]), 0);
    return { summary: [{ label: 'Purchased value', value: S('purchase_value'), money: true }, { label: 'Sales value', value: S('sales_value'), money: true }, { label: 'Units sold', value: S('sold') }],
      columns: [{ key: 'name', label: 'Medicine' }, { key: 'purchased', label: 'Purchased qty' }, { key: 'sold', label: 'Sold qty' }, { key: 'stock', label: 'In stock' }, { key: 'purchase_value', label: 'Purchase value', money: true }, { key: 'sales_value', label: 'Sales value', money: true }], rows };
  },
  async total(from, to) {
    const tables = [['Patients', 'patients'], ['Doctors', 'doctors'], ['Employees', 'employees'], ['Appointments', 'appointments'], ['Patient bills', 'service_orders'], ['Investigations', 'investigations'], ['Suppliers', 'suppliers'], ['Stock products', 'products'], ['Medicines', 'medicines'], ['Medicine sales', 'medicine_sales'], ['System users', 'users']];
    const rows = await Promise.all(tables.map(async ([module, t]) => ({ module, records: (await one(`SELECT COUNT(*) n FROM ${t}`)).n })));
    const fin = await REPORTS['income-expense'](from, to);
    const stockVal = await one('SELECT COALESCE(SUM(stock * purchase_price),0) v FROM medicines');
    return { summary: [...fin.summary, { label: 'Medicine stock value', value: Number(stockVal.v), money: true }],
      columns: [{ key: 'module', label: 'Module' }, { key: 'records', label: 'Total records' }], rows };
  },
};

r.get('/reports/:type', async (req, res, next) => { try {
  const fn = REPORTS[req.params.type];
  if (!fn) return res.status(404).json({ message: 'Unknown report' });
  res.json(await fn(req.query.from || '1970-01-01', req.query.to || '2999-12-31'));
} catch (e) { next(e); } });

export default r;
