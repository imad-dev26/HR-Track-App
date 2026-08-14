import type { DatabaseResult } from "@app-types/index";
import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (db) return db;
  db = await Database.load("sqlite:hrtrack.db");
  return db;
}

export async function select<T = Record<string, unknown>>(
  query: string,
  bindValues: unknown[] = []
): Promise<T[]> {
  const database = await getDb();
  const result = await database.select<T[]>(query, bindValues);
  return result;
}

export async function execute(
  query: string,
  bindValues: unknown[] = []
): Promise<DatabaseResult> {
  const database = await getDb();
  const result = await database.execute(query, bindValues);
  return {
    lastInsertId: result.lastInsertId,
    rowsAffected: result.rowsAffected,
  };
}

export async function executeTransaction(
  statements: { query: string; bindValues?: unknown[] }[]
): Promise<void> {
  const database = await getDb();
  await database.execute("BEGIN TRANSACTION;");
  try {
    for (const stmt of statements) {
      await database.execute(stmt.query, stmt.bindValues || []);
    }
    await database.execute("COMMIT;");
  } catch (error) {
    await database.execute("ROLLBACK;");
    throw error;
  }
}
