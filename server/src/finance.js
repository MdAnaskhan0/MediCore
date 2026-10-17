import { pool } from './db.js';

// [table, date column, amount column, label]
export const INC = [
  ['service_orders', 'order_date', 'paid', 'Patient services'],
  ['due_collections', 'collected_on', 'amount', 'Due collections'],
  ['medicine_sales', 'sale_date', 'total', 'Medicine sales'],
];
export const EXP = [
  ['doctor_payments', 'paid_on', 'amount', 'Doctor payments'],
  ['supplier_payments', 'paid_on', 'amount', 'Supplier payments'],
  ['purchases', 'purchase_date', 'total', 'General stock purchases'],
  ['refunds', 'refunded_on', 'amount', 'Patient refunds'],
  ['sales_returns', 'return_date', 'refund_amount', 'Medicine sales returns'],
  ['expenses', 'expense_date', 'amount', 'Other expenses'],
];

export const totals = (list, from, to) => Promise.all(list.map(async ([t, d, a, label]) => {
  const [[r]] = await pool.query(`SELECT COALESCE(SUM(${a}),0) v FROM ${t} WHERE ${d} BETWEEN ? AND ?`, [from, to]);
  return { category: label, amount: Number(r.v) };
}));

export async function series(list, fmt, from, to) {
  const m = {};
  await Promise.all(list.map(async ([t, d, a]) => {
    const [rows] = await pool.query(`SELECT DATE_FORMAT(${d},'${fmt}') k, SUM(${a}) v FROM ${t} WHERE ${d} BETWEEN ? AND ? GROUP BY k`, [from, to]);
    rows.forEach(r => { m[r.k] = (m[r.k] || 0) + Number(r.v); });
  }));
  return m;
}
