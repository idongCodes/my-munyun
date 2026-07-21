import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { supabase, isSupabaseConfigured } from './supabase';

const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'data.db')
  : path.join(process.cwd(), 'data.db');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }
  
  dbInstance = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
  
  return dbInstance;
}

export async function initDb() {
  if (isSupabaseConfigured()) {
    // Supabase handles migrations via schema.sql in dashboard
    return;
  }

  const db = await getDb();
  
  // Credentials
  await db.exec(`
    CREATE TABLE IF NOT EXISTS credentials (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
  
  // Accounts
  await db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mask TEXT,
      type TEXT,
      subtype TEXT,
      balance_available REAL,
      balance_current REAL,
      institution TEXT NOT NULL
    )
  `);
  
  // Transactions
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      account_id TEXT,
      account_name TEXT,
      institution TEXT,
      notes TEXT,
      pending INTEGER DEFAULT 0,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    )
  `);
  
  // Budgets
  await db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      category TEXT PRIMARY KEY,
      limit_amount REAL NOT NULL
    )
  `);
}

// Credentials
export async function getCredential(key: string): Promise<string | null> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('credentials').select('value').eq('key', key);
    if (error) {
      console.error(`Supabase error reading credential "${key}":`, error);
    }
    return data && data.length > 0 ? data[data.length - 1].value : null;
  }

  const db = await getDb();
  const row = await db.get('SELECT value FROM credentials WHERE key = ?', key);
  return row ? row.value : null;
}

export async function setCredential(key: string, value: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('credentials').upsert({ key, value });
    if (error) {
      console.error(`Supabase error writing credential "${key}":`, error);
      throw new Error(`Supabase write failed: ${error.message} (${error.code})`);
    }
    return;
  }

  const db = await getDb();
  await db.run('INSERT OR REPLACE INTO credentials (key, value) VALUES (?, ?)', key, value);
}

export async function deleteCredential(key: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('credentials').delete().eq('key', key);
    if (error) {
      console.error(`Supabase error deleting credential "${key}":`, error);
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
    return;
  }

  const db = await getDb();
  await db.run('DELETE FROM credentials WHERE key = ?', key);
}

// Accounts
export async function getAccounts() {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase.from('accounts').select('*');
    return data || [];
  }

  const db = await getDb();
  return await db.all('SELECT * FROM accounts');
}

export async function saveAccounts(accounts: any[]) {
  if (isSupabaseConfigured() && supabase) {
    if (accounts.length > 0) {
      await supabase.from('accounts').upsert(accounts);
    }
    return;
  }

  const db = await getDb();
  for (const acc of accounts) {
    await db.run(
      `INSERT OR REPLACE INTO accounts 
      (id, name, mask, type, subtype, balance_available, balance_current, institution)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      acc.id,
      acc.name,
      acc.mask || null,
      acc.type || null,
      acc.subtype || null,
      acc.balance_available ?? null,
      acc.balance_current ?? null,
      acc.institution
    );
  }
}

export async function clearAccounts() {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('accounts').delete().neq('id', '');
    return;
  }

  const db = await getDb();
  await db.run('DELETE FROM accounts');
}

// Transactions
export async function getTransactions() {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    return data || [];
  }

  const db = await getDb();
  return await db.all('SELECT * FROM transactions ORDER BY date DESC');
}

export async function saveTransactions(transactions: any[]) {
  if (isSupabaseConfigured() && supabase) {
    if (transactions.length > 0) {
      await supabase.from('transactions').upsert(transactions);
    }
    return;
  }

  const db = await getDb();
  for (const tx of transactions) {
    const existing = await db.get('SELECT notes FROM transactions WHERE id = ?', tx.id);
    const existingNotes = existing ? existing.notes : null;
    
    await db.run(
      `INSERT OR REPLACE INTO transactions 
      (id, date, amount, name, category, account_id, account_name, institution, notes, pending)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      tx.id,
      tx.date,
      tx.amount,
      tx.name,
      tx.category || 'Uncategorized',
      tx.account_id || null,
      tx.account_name || null,
      tx.institution || null,
      existingNotes || tx.notes || null,
      tx.pending ? 1 : 0
    );
  }
}

export async function updateTransaction(id: string, category: string, notes: string) {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('transactions').update({ category, notes }).eq('id', id);
    return;
  }

  const db = await getDb();
  await db.run(
    'UPDATE transactions SET category = ?, notes = ? WHERE id = ?',
    category,
    notes,
    id
  );
}

export async function clearTransactions() {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('transactions').delete().neq('id', '');
    return;
  }

  const db = await getDb();
  await db.run('DELETE FROM transactions');
}

// Budgets
export async function getBudgets() {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase.from('budgets').select('*');
    const result: Record<string, number> = {};
    if (data) {
      for (const r of data) {
        result[r.category] = Number(r.limit_amount);
      }
    }
    return result;
  }

  const db = await getDb();
  const rows = await db.all('SELECT * FROM budgets');
  const result: Record<string, number> = {};
  for (const r of rows) {
    result[r.category] = r.limit_amount;
  }
  return result;
}

export async function saveBudget(category: string, limit_amount: number) {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('budgets').upsert({ category, limit_amount });
    return;
  }

  const db = await getDb();
  await db.run('INSERT OR REPLACE INTO budgets (category, limit_amount) VALUES (?, ?)', category, limit_amount);
}

export async function deleteBudget(category: string) {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('budgets').delete().eq('category', category);
    return;
  }

  const db = await getDb();
  await db.run('DELETE FROM budgets WHERE category = ?', category);
}

export async function wipeDatabase() {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('transactions').delete().neq('id', '');
    await supabase.from('accounts').delete().neq('id', '');
    await supabase.from('budgets').delete().neq('category', '');
    await supabase.from('credentials').delete().neq('key', '');
    return;
  }
  const db = await getDb();
  await db.run('DELETE FROM transactions');
  await db.run('DELETE FROM accounts');
  await db.run('DELETE FROM budgets');
  await db.run('DELETE FROM credentials');
}
