import mysql from 'mysql2/promise';
import fs from 'fs';
import { dbConfig } from './db.js';

const sql = fs.readFileSync(new URL('../database/schema.sql', import.meta.url), 'utf8')
  .replace(/hospital_db/g, process.env.DB_NAME || 'hospital_db');
const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true });
await conn.query(sql);
console.log('✔ Database and tables are ready');
await conn.end();
