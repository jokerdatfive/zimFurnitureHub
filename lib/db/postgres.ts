import { Pool } from 'pg';

// Global pool instance to prevent connection leaks across Next.js hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPgPool(): Pool | null {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('[Postgres] Neither DIRECT_URL nor DATABASE_URL environment variable is set.');
    return null;
  }

  try {
    return new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  } catch (err) {
    console.warn('[Postgres] Pool initialization error:', err);
    return null;
  }
}

export const pgPool: Pool | null = global.__pgPool || createPgPool();

if (process.env.NODE_ENV !== 'production' && pgPool) {
  global.__pgPool = pgPool;
}

export async function queryPg<T = any>(text: string, params?: any[]): Promise<T[]> {
  if (!pgPool) {
    throw new Error('Postgres pool not initialized');
  }
  const client = await pgPool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}
