import { Pool } from 'pg';
import { env } from './env';

export const pool = new Pool({
  host:     env.DB_HOST,
  port:     env.DB_PORT,
  database: env.DB_NAME,
  user:     env.DB_USER,
  password: env.DB_PASSWORD,
  min:      env.DB_POOL_MIN,
  max:      env.DB_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
});

pool.on('connect', () => {
  if (env.NODE_ENV === 'development') {
    console.log('[DB] New client connected to PostgreSQL');
  }
});

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL connection established');
  } finally {
    client.release();
  }
}

// Helper: begin transaction
export async function withTransaction<T>(
  fn: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
