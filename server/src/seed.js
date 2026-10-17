import bcrypt from 'bcryptjs';
import { pool } from './db.js';

await pool.query("INSERT IGNORE INTO roles (name, permissions, description) VALUES ('Admin', '*', 'Full access to every module')");
const [[role]] = await pool.query("SELECT id FROM roles WHERE name = 'Admin'");
await pool.query('INSERT IGNORE INTO users (name, email, password, role_id) VALUES (?,?,?,?)',
  ['Administrator', 'admin@hospital.com', await bcrypt.hash('admin123', 10), role.id]);
for (const [n, s] of [['Piece', 'Pcs'], ['Box', 'Box'], ['Strip', 'Strip'], ['Bottle', 'Btl'], ['Vial', 'Vial']])
  await pool.query('INSERT IGNORE INTO units (name, short_name) VALUES (?,?)', [n, s]);
const [[{ c }]] = await pool.query('SELECT COUNT(*) c FROM services');
if (!c) await pool.query('INSERT INTO services (name, category, price) VALUES ?', [[
  ['General Consultation', 'Consultation', 500], ['Complete Blood Count (CBC)', 'Pathology', 600],
  ['Chest X-Ray', 'Radiology', 800], ['ECG', 'Procedure', 400], ['Ultrasonography (Whole Abdomen)', 'Radiology', 1500]]]);
console.log('✔ Seeded. Login: admin@hospital.com / admin123');
process.exit(0);
