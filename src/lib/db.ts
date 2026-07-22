import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { supabase, isSupabaseConfigured } from './supabase';

const DB_PATH = process.env.DB_PATH || (process.env.VERCEL
  ? path.join('/tmp', 'data.db')
  : path.join(process.cwd(), 'data.db'));

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

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
  
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      preferred_name TEXT,
      mobile_number TEXT,
      password TEXT,
      totp_secret TEXT,
      totp_enabled INTEGER DEFAULT 0,
      google_id TEXT,
      avatar_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Credentials table (user-scoped)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS credentials (
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      PRIMARY KEY (user_id, key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Accounts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mask TEXT,
      type TEXT,
      subtype TEXT,
      balance_available REAL,
      balance_current REAL,
      institution TEXT NOT NULL,
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Transactions table
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
      user_id TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Budgets table (user-scoped composite key)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      limit_amount REAL NOT NULL,
      PRIMARY KEY (user_id, category),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Insert default user for backward compatibility and test runs
  await db.run(
    `INSERT OR IGNORE INTO users (id, email, first_name, last_name, preferred_name, mobile_number, password)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    DEFAULT_USER_ID,
    'admin@example.com',
    'Admin',
    'User',
    'Admin',
    '+17743126471',
    'admin'
  );
}

// User Profile Operations
export async function createUser(user: any): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('users').insert(user);
    if (error) {
      console.error('Supabase error creating user:', error);
      throw new Error(`Supabase create user failed: ${error.message}`);
    }
    return;
  }

  const db = await getDb();
  await db.run(
    `INSERT INTO users (id, email, first_name, last_name, preferred_name, mobile_number, password, totp_secret, totp_enabled, google_id, avatar_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    user.id,
    user.email,
    user.first_name,
    user.last_name,
    user.preferred_name || null,
    user.mobile_number || null,
    user.password || null,
    user.totp_secret || null,
    user.totp_enabled ? 1 : 0,
    user.google_id || null,
    user.avatar_url || null
  );
}

export async function getUserById(id: string): Promise<any | null> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Supabase error reading user "${id}":`, error);
    }
    return data || null;
  }

  const db = await getDb();
  const row = await db.get('SELECT * FROM users WHERE id = ?', id);
  if (row) {
    row.totp_enabled = row.totp_enabled === 1;
  }
  return row || null;
}

export async function getUserByEmail(email: string): Promise<any | null> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('users').select('*').eq('email', email.trim().toLowerCase()).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Supabase error reading user by email "${email}":`, error);
    }
    return data || null;
  }

  const db = await getDb();
  const row = await db.get('SELECT * FROM users WHERE LOWER(email) = ?', email.trim().toLowerCase());
  if (row) {
    row.totp_enabled = row.totp_enabled === 1;
  }
  return row || null;
}

export async function getUserByPhone(phone: string): Promise<any | null> {
  const cleanPhone = phone.trim();
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('users').select('*').eq('mobile_number', cleanPhone).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Supabase error reading user by phone "${phone}":`, error);
    }
    return data || null;
  }

  const db = await getDb();
  const row = await db.get('SELECT * FROM users WHERE mobile_number = ?', cleanPhone);
  if (row) {
    row.totp_enabled = row.totp_enabled === 1;
  }
  return row || null;
}

export async function updateUser(id: string, updates: any): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('users').update(updates).eq('id', id);
    if (error) {
      console.error(`Supabase error updating user "${id}":`, error);
      throw new Error(`Supabase update user failed: ${error.message}`);
    }
    return;
  }

  const db = await getDb();
  const keys = Object.keys(updates);
  if (keys.length === 0) return;
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => {
    const v = updates[k];
    if (k === 'totp_enabled') return v ? 1 : 0;
    return v;
  });
  values.push(id);
  await db.run(`UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, ...values);
}

export async function deleteUser(id: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error(`Supabase error deleting user "${id}":`, error);
      throw new Error(`Supabase delete user failed: ${error.message}`);
    }
    return;
  }

  const db = await getDb();
  await db.run('DELETE FROM users WHERE id = ?', id);
}

// Credentials (Overloaded for Multi-User & Legacy Scoping support)
export async function getCredential(key: string): Promise<string | null>;
export async function getCredential(userId: string, key: string): Promise<string | null>;
export async function getCredential(arg1: string, arg2?: string): Promise<string | null> {
  const userId = arg2 ? arg1 : DEFAULT_USER_ID;
  const key = arg2 ? arg2 : arg1;

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('credentials')
      .select('value')
      .eq('user_id', userId)
      .eq('key', key);
    if (error) {
      console.error(`Supabase error reading credential "${key}" for user "${userId}":`, error);
    }
    return data && data.length > 0 ? data[data.length - 1].value : null;
  }

  const db = await getDb();
  const row = await db.get('SELECT value FROM credentials WHERE user_id = ? AND key = ?', userId, key);
  return row ? row.value : null;
}

export async function setCredential(key: string, value: string): Promise<void>;
export async function setCredential(userId: string, key: string, value: string): Promise<void>;
export async function setCredential(arg1: string, arg2: string, arg3?: string): Promise<void> {
  const userId = arg3 ? arg1 : DEFAULT_USER_ID;
  const key = arg3 ? arg2 : arg1;
  const value = arg3 ? arg3 : arg2;

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('credentials')
      .upsert({ user_id: userId, key, value });
    if (error) {
      console.error(`Supabase error writing credential "${key}" for user "${userId}":`, error);
      throw new Error(`Supabase write failed: ${error.message} (${error.code})`);
    }
    return;
  }

  const db = await getDb();
  await db.run('INSERT OR REPLACE INTO credentials (user_id, key, value) VALUES (?, ?, ?)', userId, key, value);
}

export async function deleteCredential(key: string): Promise<void>;
export async function deleteCredential(userId: string, key: string): Promise<void>;
export async function deleteCredential(arg1: string, arg2?: string): Promise<void> {
  const userId = arg2 ? arg1 : DEFAULT_USER_ID;
  const key = arg2 ? arg2 : arg1;

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('credentials')
      .delete()
      .eq('user_id', userId)
      .eq('key', key);
    if (error) {
      console.error(`Supabase error deleting credential "${key}" for user "${userId}":`, error);
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
    return;
  }

  const db = await getDb();
  await db.run('DELETE FROM credentials WHERE user_id = ? AND key = ?', userId, key);
}

// Accounts (User-Scoped, userId defaults to DEFAULT_USER_ID for test/legacy queries)
export async function getAccounts(userId: string = DEFAULT_USER_ID) {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase.from('accounts').select('*').eq('user_id', userId);
    return data || [];
  }

  const db = await getDb();
  return await db.all('SELECT * FROM accounts WHERE user_id = ?', userId);
}

export async function saveAccounts(accounts: any[], userId: string = DEFAULT_USER_ID) {
  if (isSupabaseConfigured() && supabase) {
    if (accounts.length > 0) {
      const records = accounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        mask: acc.mask || null,
        type: acc.type || null,
        subtype: acc.subtype || null,
        balance_available: acc.balance_available ?? null,
        balance_current: acc.balance_current ?? null,
        institution: acc.institution,
        user_id: userId
      }));
      const { error } = await supabase.from('accounts').upsert(records);
      if (error) {
        console.error('Supabase error saving accounts:', error);
        throw new Error(`Supabase accounts upsert failed: ${error.message}`);
      }
    }
    return;
  }

  const db = await getDb();
  for (const acc of accounts) {
    await db.run(
      `INSERT OR REPLACE INTO accounts 
      (id, name, mask, type, subtype, balance_available, balance_current, institution, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      acc.id,
      acc.name,
      acc.mask || null,
      acc.type || null,
      acc.subtype || null,
      acc.balance_available ?? null,
      acc.balance_current ?? null,
      acc.institution,
      userId
    );
  }
}

export async function clearAccounts(userId: string = DEFAULT_USER_ID) {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('accounts').delete().eq('user_id', userId);
    if (error) {
      console.error('Supabase error clearing accounts:', error);
      throw new Error(`Supabase clear accounts failed: ${error.message}`);
    }
    return;
  }

  const db = await getDb();
  await db.run('DELETE FROM accounts WHERE user_id = ?', userId);
}

// Transactions (User-Scoped, userId defaults to DEFAULT_USER_ID for test/legacy queries)
export async function getTransactions(userId: string = DEFAULT_USER_ID) {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    return data || [];
  }

  const db = await getDb();
  return await db.all('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', userId);
}

export async function saveTransactions(transactions: any[], userId: string = DEFAULT_USER_ID) {
  if (isSupabaseConfigured() && supabase) {
    if (transactions.length > 0) {
      const records = transactions.map(tx => ({
        id: tx.id,
        date: tx.date,
        amount: tx.amount,
        name: tx.name,
        category: tx.category || 'Uncategorized',
        account_id: tx.account_id || null,
        account_name: tx.account_name || null,
        institution: tx.institution || null,
        notes: tx.notes || null,
        pending: tx.pending ? true : false,
        user_id: userId
      }));
      const { error } = await supabase.from('transactions').upsert(records);
      if (error) {
        console.error('Supabase error saving transactions:', error);
        throw new Error(`Supabase transactions upsert failed: ${error.message}`);
      }
    }
    return;
  }

  const db = await getDb();
  for (const tx of transactions) {
    const existing = await db.get('SELECT notes FROM transactions WHERE id = ? AND user_id = ?', tx.id, userId);
    const existingNotes = existing ? existing.notes : null;
    
    await db.run(
      `INSERT OR REPLACE INTO transactions 
      (id, date, amount, name, category, account_id, account_name, institution, notes, pending, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      tx.id,
      tx.date,
      tx.amount,
      tx.name,
      tx.category || 'Uncategorized',
      tx.account_id || null,
      tx.account_name || null,
      tx.institution || null,
      existingNotes || tx.notes || null,
      tx.pending ? 1 : 0,
      userId
    );
  }
}

export async function updateTransaction(id: string, category: string, notes: string, userId: string = DEFAULT_USER_ID) {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('transactions')
      .update({ category, notes })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('Supabase error updating transaction:', error);
      throw new Error(`Supabase transaction update failed: ${error.message}`);
    }
    return;
  }

  const db = await getDb();
  await db.run(
    'UPDATE transactions SET category = ?, notes = ? WHERE id = ? AND user_id = ?',
    category,
    notes,
    id,
    userId
  );
}

export async function clearTransactions(userId: string = DEFAULT_USER_ID) {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('transactions').delete().eq('user_id', userId);
    if (error) {
      console.error('Supabase error clearing transactions:', error);
      throw new Error(`Supabase clear transactions failed: ${error.message}`);
    }
    return;
  }

  const db = await getDb();
  await db.run('DELETE FROM transactions WHERE user_id = ?', userId);
}

// Budgets (User-Scoped, userId defaults to DEFAULT_USER_ID for test/legacy queries)
export async function getBudgets(userId: string = DEFAULT_USER_ID) {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase.from('budgets').select('*').eq('user_id', userId);
    const result: Record<string, number> = {};
    if (data) {
      for (const r of data) {
        result[r.category] = Number(r.limit_amount);
      }
    }
    return result;
  }

  const db = await getDb();
  const rows = await db.all('SELECT * FROM budgets WHERE user_id = ?', userId);
  const result: Record<string, number> = {};
  for (const r of rows) {
    result[r.category] = r.limit_amount;
  }
  return result;
}

export async function saveBudget(category: string, limit_amount: number, userId: string = DEFAULT_USER_ID) {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('budgets').upsert({ category, limit_amount, user_id: userId });
    if (error) {
      console.error('Supabase error saving budget:', error);
      throw new Error(`Supabase budget upsert failed: ${error.message}`);
    }
    return;
  }

  const db = await getDb();
  await db.run('INSERT OR REPLACE INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?)', userId, category, limit_amount);
}

export async function deleteBudget(category: string, userId: string = DEFAULT_USER_ID) {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('budgets').delete().eq('category', category).eq('user_id', userId);
    if (error) {
      console.error('Supabase error deleting budget:', error);
      throw new Error(`Supabase budget delete failed: ${error.message}`);
    }
    return;
  }

  const db = await getDb();
  await db.run('DELETE FROM budgets WHERE user_id = ? AND category = ?', userId, category);
}

// Database Wiping (Scoped to current user)
export async function wipeDatabase(userId: string = DEFAULT_USER_ID) {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('transactions').delete().eq('user_id', userId);
    await supabase.from('accounts').delete().eq('user_id', userId);
    await supabase.from('budgets').delete().eq('user_id', userId);
    await supabase.from('credentials').delete().eq('user_id', userId);
    await supabase.from('users').delete().eq('id', userId);
    return;
  }
  const db = await getDb();
  await db.run('DELETE FROM transactions WHERE user_id = ?', userId);
  await db.run('DELETE FROM accounts WHERE user_id = ?', userId);
  await db.run('DELETE FROM budgets WHERE user_id = ?', userId);
  await db.run('DELETE FROM credentials WHERE user_id = ?', userId);
  await db.run('DELETE FROM users WHERE id = ?', userId);
}
