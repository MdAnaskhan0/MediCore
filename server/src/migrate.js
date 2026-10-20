import mysql from 'mysql2/promise';
import fs from 'fs';
import { dbConfig } from './db.js';

const DB = process.env.DB_NAME || 'hospital_db';
const sql = fs.readFileSync(new URL('../database/schema.sql', import.meta.url), 'utf8').replace(/hospital_db/g, DB);
const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true });
await conn.query(sql);

// upgrade older installs (tables created before the patient portal existed)
const [col] = await conn.query("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='appointments' AND COLUMN_NAME='source'", [DB]);
if (!col.length) await conn.query(`ALTER TABLE \`${DB}\`.appointments ADD COLUMN source VARCHAR(20) DEFAULT 'Staff'`);

const ensure = async (table, col, def) => {
  const [r] = await conn.query('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?', [DB, table, col]);
  if (!r.length) await conn.query(`ALTER TABLE \`${DB}\`.\`${table}\` ADD COLUMN \`${col}\` ${def}`);
};
for (const [c, d] of [['photo_url', 'VARCHAR(500)'], ['qualification', 'VARCHAR(150)'], ['experience_years', 'INT'], ['bio', 'VARCHAR(500)'], ['popular', "VARCHAR(3) NOT NULL DEFAULT 'No'"]]) await ensure('doctors', c, d);
await ensure('services', 'description', 'VARCHAR(255)');
await ensure('services', 'show_on_portal', "VARCHAR(3) NOT NULL DEFAULT 'Yes'");

console.log('✔ Database and tables are ready');
await conn.end();
