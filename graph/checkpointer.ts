import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';

export const REPO_ROOT = path.resolve(__dirname, '..');

export function createCheckpointer(repoRoot = REPO_ROOT): SqliteSaver {
  const databasePath = path.join(repoRoot, 'database', 'langgraph-checkpoints.sqlite');
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new Database(databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  return new SqliteSaver(db);
}
