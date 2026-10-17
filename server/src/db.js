import mysql from 'mysql2/promise';
import 'dotenv/config';

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

export const pool = mysql.createPool({
  ...dbConfig,
  database: process.env.DB_NAME || 'hospital_db',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // keep DATE/TIME as plain strings
});
