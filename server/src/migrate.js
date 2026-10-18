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

console.log('✔ Database and tables are ready');
await conn.end();
