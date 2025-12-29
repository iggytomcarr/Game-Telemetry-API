import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

let pool: mysql.Pool;

export async function connectMySQL(): Promise<mysql.Pool> {
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'telemetry',
    password: process.env.MYSQL_PASSWORD || 'telemetry_password',
    database: process.env.MYSQL_DATABASE || 'game_telemetry',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Test connection
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
  
  return pool;
}

export function getPool(): mysql.Pool {
  if (!pool) {
    throw new Error('MySQL pool not initialized. Call connectMySQL() first.');
  }
  return pool;
}

export async function query<T>(sql: string, params?: any[]): Promise<T> {
  const [rows] = await getPool().execute(sql, params);
  return rows as T;
}
