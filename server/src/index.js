import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';
import crud from './crud.js';
import insights from './insights.js';
import path from 'path';
import uploads, { UPLOAD_DIR } from './uploads.js';
import { publicRouter, patientAuth, portalRouter } from './portal.js';

const SECRET = process.env.JWT_SECRET || 'dev_secret';
const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', setHeaders: r => r.setHeader('X-Content-Type-Options', 'nosniff') }));

app.post('/api/auth/login', async (req, res, next) => { try {
  const { email, password } = req.body;
  const [[u]] = await pool.query("SELECT u.*, r.name role, r.permissions FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ? AND u.status = 'Active'", [email]);
  if (!u || !(await bcrypt.compare(password || '', u.password))) return res.status(401).json({ message: 'Incorrect email or password.' });
  const user = { id: u.id, name: u.name, email: u.email, role: u.role, permissions: u.permissions || '' };
  res.json({ token: jwt.sign(user, SECRET, { expiresIn: '12h' }), user });
} catch (e) { next(e); } });

const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET); if (req.user.kind === 'patient') throw new Error('patient token'); next(); }
  catch { res.status(401).json({ message: 'Session expired. Please sign in again.' }); }
};
app.use('/api/public', publicRouter);
app.use('/api/portal', patientAuth, portalRouter);
app.use('/api', auth, uploads, insights, crud);
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: err.message }); });

app.listen(process.env.PORT || 5000, () => console.log(`HMS API running on http://localhost:${process.env.PORT || 5000}`));
