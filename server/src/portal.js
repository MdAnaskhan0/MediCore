import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

const SECRET = process.env.JWT_SECRET || 'dev_secret';
// Appointment slots: every 30 minutes, 09:00–17:00 (change here)
const SLOT_START = 9 * 60, SLOT_END = 17 * 60, SLOT_STEP = 30;
const SLOTS = [];
for (let m = SLOT_START; m < SLOT_END; m += SLOT_STEP) SLOTS.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);

const bad = (message, status = 400) => Object.assign(new Error(message), { status });
const handle = fn => (req, res, next) => fn(req, res).catch(e => {
  if (e.status) return res.status(e.status).json({ message: e.message });
  if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'An account with this email already exists.' });
  next(e);
});
const hits = new Map(); // tiny in-memory rate limiter for public endpoints
const limit = (max, ms) => (req, res, next) => {
  const k = req.ip + req.path, now = Date.now(), a = (hits.get(k) || []).filter(t => now - t < ms);
  if (a.length >= max) return res.status(429).json({ message: 'Too many attempts. Please try again in a few minutes.' });
  a.push(now); hits.set(k, a); next();
};
async function tx(fn) {
  const conn = await pool.getConnection();
  try { await conn.beginTransaction(); const out = await fn(conn); await conn.commit(); return out; }
  catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}
const clean = v => (typeof v === 'string' ? v.trim() : v);
const code = () => 'PT' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 10);
const nowParts = () => { const n = new Date(); return { today: n.toLocaleDateString('en-CA'), time: n.toTimeString().slice(0, 5) }; };

async function takenTimes(conn, doctor_id, date) {
  const [rows] = await conn.query("SELECT LEFT(appointment_time,5) t FROM appointments WHERE doctor_id=? AND appointment_date=? AND status<>'Cancelled'", [doctor_id, date]);
  return new Set(rows.map(r => r.t));
}

async function book(conn, { patient_id, doctor_id, date, time, note, source }) {
  const [[doc]] = await conn.query("SELECT id FROM doctors WHERE id=? AND status='Active' FOR UPDATE", [doctor_id]);
  if (!doc) throw bad('Please choose an available doctor.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw bad('Please choose a valid date.');
  const { today, time: nowT } = nowParts();
  if (date < today) throw bad('Appointments cannot be booked in the past.');
  if (!SLOTS.includes(time)) throw bad('Please choose one of the available time slots.');
  if (date === today && time <= nowT) throw bad('That time has already passed. Please pick a later slot.');
  if ((await takenTimes(conn, doctor_id, date)).has(time)) throw bad('That slot was just taken. Please pick another time.', 409);
  const [r] = await conn.query('INSERT INTO appointments SET ?', [{ patient_id, doctor_id, appointment_date: date, appointment_time: time, status: 'Requested', note: clean(note) || null, source }]);
  return r.insertId;
}

/* ================= PUBLIC (no login) ================= */
export const publicRouter = Router();

// Doctor finder: filter by name and/or department (specialization)
publicRouter.get('/doctors', handle(async (req, res) => {
  const q = String(req.query.q || '').trim().replace(/^dr\.?\s*/i, '');
  const w = ["status = 'Active'"], p = [];
  if (req.query.id) { w.push('id = ?'); p.push(req.query.id); }
  if (q) { w.push('name LIKE ?'); p.push(`%${q}%`); }
  if (req.query.department) { w.push('specialization = ?'); p.push(req.query.department); }
  const [rows] = await pool.query(`SELECT id, name, specialization, fee, photo_url, qualification, experience_years FROM doctors WHERE ${w.join(' AND ')} ORDER BY name LIMIT 30`, p);
  res.json(rows);
}));

publicRouter.get('/departments', handle(async (req, res) => {
  const [rows] = await pool.query("SELECT specialization name, COUNT(*) doctors FROM doctors WHERE status = 'Active' AND specialization IS NOT NULL AND specialization <> '' GROUP BY specialization ORDER BY specialization");
  res.json(rows);
}));

// Everything the portal home page shows, managed from the admin panel
publicRouter.get('/home', handle(async (req, res) => {
  const [[slides], [doctors], [services], [gallery]] = await Promise.all([
    pool.query("SELECT id, title, subtitle, image_url, button_text, button_link FROM portal_slides WHERE status = 'Active' ORDER BY sort_order, id"),
    pool.query("SELECT id, name, specialization, fee, photo_url, qualification, experience_years, bio FROM doctors WHERE status = 'Active' AND popular = 'Yes' ORDER BY name LIMIT 8"),
    pool.query("SELECT id, name, category, price, description FROM services WHERE show_on_portal = 'Yes' ORDER BY category, name"),
    pool.query("SELECT id, title, image_url, category FROM portal_gallery WHERE status = 'Active' AND image_url IS NOT NULL AND image_url <> '' ORDER BY sort_order, id"),
  ]);
  res.json({ slides, doctors, services, gallery });
}));

publicRouter.get('/slots', handle(async (req, res) => {
  const { doctor_id, date } = req.query;
  if (!doctor_id || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw bad('Choose a doctor and a date.');
  const taken = await takenTimes(pool, doctor_id, date);
  const { today, time } = nowParts();
  res.json({ slots: SLOTS.map(t => ({ time: t, available: !taken.has(t) && !(date < today) && !(date === today && t <= time) })) });
}));

// Guest booking: no account needed
publicRouter.post('/appointments', limit(10, 15 * 60 * 1000), handle(async (req, res) => {
  const b = Object.fromEntries(Object.entries(req.body).map(([k, v]) => [k, clean(v)]));
  if (!b.name || b.name.length < 2) throw bad('Please enter your full name.');
  if (!b.phone || b.phone.replace(/\D/g, '').length < 6) throw bad('Please enter a phone number we can reach you on.');
  const out = await tx(async conn => {
    const [[ex]] = await conn.query('SELECT id FROM patients WHERE phone=? AND LOWER(name)=LOWER(?) LIMIT 1', [b.phone, b.name]);
    let patient_id = ex?.id;
    if (!patient_id) {
      const [r] = await conn.query('INSERT INTO patients SET ?', [{ patient_code: code(), name: b.name, phone: b.phone, age: b.age || null, gender: b.gender || null }]);
      patient_id = r.insertId;
    }
    const id = await book(conn, { patient_id, doctor_id: b.doctor_id, date: b.date, time: b.time, note: b.note, source: 'Guest' });
    return { id };
  });
  res.status(201).json(out);
}));

publicRouter.post('/register', limit(10, 15 * 60 * 1000), handle(async (req, res) => {
  const b = Object.fromEntries(Object.entries(req.body).map(([k, v]) => [k, clean(v)]));
  if (!b.name || b.name.length < 2) throw bad('Please enter your full name.');
  if (!/^\S+@\S+\.\S+$/.test(b.email || '')) throw bad('Please enter a valid email address.');
  if (!b.password || b.password.length < 6) throw bad('Password must be at least 6 characters.');
  const hash = await bcrypt.hash(req.body.password, 10);
  await tx(async conn => {
    const [r] = await conn.query('INSERT INTO patients SET ?', [{ patient_code: code(), name: b.name, phone: b.phone || null, age: b.age || null, gender: b.gender || null, blood_group: b.blood_group || null, address: b.address || null }]);
    await conn.query('INSERT INTO patient_accounts SET ?', [{ patient_id: r.insertId, email: b.email.toLowerCase(), password: hash }]);
  });
  res.status(201).json({ ok: true });
}));

publicRouter.post('/login', limit(15, 15 * 60 * 1000), handle(async (req, res) => {
  const { email = '', password = '' } = req.body;
  const [[a]] = await pool.query('SELECT a.id, a.patient_id, a.email, a.password, p.name, p.patient_code FROM patient_accounts a JOIN patients p ON p.id = a.patient_id WHERE a.email = ?', [String(email).trim().toLowerCase()]);
  if (!a || !(await bcrypt.compare(password, a.password))) throw bad('Incorrect email or password.', 401);
  const user = { kind: 'patient', patient_id: a.patient_id, name: a.name, email: a.email, patient_code: a.patient_code };
  res.json({ token: jwt.sign(user, SECRET, { expiresIn: '12h' }), user });
}));

/* ================= PATIENT (logged in) ================= */
export const patientAuth = (req, res, next) => {
  try {
    const u = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET);
    if (u.kind !== 'patient') throw new Error('not patient');
    req.patient = u; next();
  } catch { res.status(401).json({ message: 'Please sign in to continue.' }); }
};

export const portalRouter = Router();

portalRouter.get('/me', handle(async (req, res) => {
  const [[p]] = await pool.query('SELECT p.*, a.email FROM patients p JOIN patient_accounts a ON a.patient_id = p.id WHERE p.id = ?', [req.patient.patient_id]);
  res.json(p);
}));

portalRouter.put('/me', handle(async (req, res) => {
  const b = req.body, d = {};
  for (const k of ['name', 'age', 'gender', 'phone', 'blood_group', 'address']) if (k in b) d[k] = clean(b[k]) === '' ? null : clean(b[k]);
  if ('name' in d && (!d.name || d.name.length < 2)) throw bad('Name cannot be empty.');
  if (Object.keys(d).length) await pool.query('UPDATE patients SET ? WHERE id = ?', [d, req.patient.patient_id]);
  res.json({ ok: true });
}));

portalRouter.get('/appointments', handle(async (req, res) => {
  const [rows] = await pool.query(`SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.note, a.source, d.name doctor, d.specialization
    FROM appointments a JOIN doctors d ON d.id = a.doctor_id WHERE a.patient_id = ? ORDER BY a.appointment_date DESC, a.appointment_time DESC`, [req.patient.patient_id]);
  res.json(rows);
}));

portalRouter.post('/appointments', handle(async (req, res) => {
  const id = await tx(conn => book(conn, { patient_id: req.patient.patient_id, doctor_id: req.body.doctor_id, date: req.body.date, time: req.body.time, note: req.body.note, source: 'Portal' }));
  res.status(201).json({ id });
}));

portalRouter.put('/appointments/:id/cancel', handle(async (req, res) => {
  const [r] = await pool.query("UPDATE appointments SET status='Cancelled' WHERE id=? AND patient_id=? AND status IN ('Requested','Scheduled') AND appointment_date >= CURDATE()", [req.params.id, req.patient.patient_id]);
  if (!r.affectedRows) throw bad('This appointment can no longer be cancelled. Please call the hospital.');
  res.json({ ok: true });
}));

// Medical track: bills/services and investigation reports (results shown once completed)
portalRouter.get('/history', handle(async (req, res) => {
  const pid = req.patient.patient_id;
  const [[bills], [tests]] = await Promise.all([
    pool.query(`SELECT o.id, o.order_date, s.name service, s.category, d.name doctor, o.amount, o.discount, (o.paid + o.collected) paid, o.refunded, o.due
      FROM service_orders o JOIN services s ON s.id = o.service_id LEFT JOIN doctors d ON d.id = o.doctor_id WHERE o.patient_id = ? ORDER BY o.order_date DESC, o.id DESC`, [pid]),
    pool.query(`SELECT i.id, i.order_id, i.test_name, i.sample_date, i.status, IF(i.status = 'Completed', i.result, NULL) result
      FROM investigations i JOIN service_orders o ON o.id = i.order_id WHERE o.patient_id = ? ORDER BY i.id DESC`, [pid]),
  ]);
  res.json({ bills, tests });
}));
