import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * PostgreSQL Database Architecture configuration
 * This creates a robust connection pool for the general multi-vendor marketplace.
 */
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'nation_market_db',
});

// Generic query helper
export const query = (text: string, params?: any[]) => pool.query(text, params);
