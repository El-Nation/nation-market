import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';

// Fix relative pathing so it exactly locates backend/dev.db securely from src

// Force resolution to the exact synced DB inside root backend folder
const dbPath = path.join(__dirname, '../dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

export const prisma = new PrismaClient({ adapter });
