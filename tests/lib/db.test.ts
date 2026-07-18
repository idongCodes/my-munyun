import { describe, it, expect, beforeEach } from 'vitest';
import { 
  initDb,
  getDb, 
  getAccounts, 
  saveAccounts,
  getTransactions, 
  saveTransactions,
  updateTransaction, 
  clearAccounts,
  clearTransactions,
  saveBudget, 
  getBudgets, 
  deleteBudget,
  setCredential,
  getCredential,
  deleteCredential
} from '@/lib/db';

describe('Database Module (db.ts)', () => {
  beforeEach(async () => {
    await initDb();
    await clearAccounts();
    await clearTransactions();
  });

  it('should initialize database connection and tables', async () => {
    const db = await getDb();
    expect(db).toBeDefined();
  });

  it('should save and fetch accounts', async () => {
    await saveAccounts([
      { id: 'acc_1', name: 'Advantage Checking', type: 'depository', subtype: 'checking', mask: '1234', balance_current: 5000, balance_available: 5000, institution: 'Bank of America' }
    ]);
    const accounts = await getAccounts();
    expect(accounts.length).toBe(1);
    expect(accounts[0].name).toBe('Advantage Checking');
    expect(accounts[0].institution).toBe('Bank of America');
  });

  it('should save and fetch transactions', async () => {
    await saveTransactions([
      { id: 'tx_1', account_id: 'acc_1', amount: 45.99, date: '2026-07-01', name: 'Whole Foods Market', category: 'Groceries', pending: false, institution: 'Bank of America', notes: 'Weekly grocery' }
    ]);
    const transactions = await getTransactions();
    expect(transactions.length).toBe(1);
    expect(transactions[0].name).toBe('Whole Foods Market');
    expect(transactions[0].category).toBe('Groceries');
  });

  it('should update transaction category and notes', async () => {
    await saveTransactions([
      { id: 'tx_update_1', account_id: 'acc_1', amount: 20, date: '2026-07-01', name: 'Coffee Shop', category: 'Dining', pending: false, institution: 'Bank of America' }
    ]);
    await updateTransaction('tx_update_1', 'Coffee & Snacks', 'Espresso');
    const transactions = await getTransactions();
    const updatedTx = transactions.find(t => t.id === 'tx_update_1');
    expect(updatedTx).toBeDefined();
    expect(updatedTx.category).toBe('Coffee & Snacks');
    expect(updatedTx.notes).toBe('Espresso');
  });

  it('should save, retrieve and delete budgets', async () => {
    await saveBudget('Dining', 350);
    let budgets = await getBudgets();
    expect(budgets['Dining']).toBe(350);

    await deleteBudget('Dining');
    budgets = await getBudgets();
    expect(budgets['Dining']).toBeUndefined();
  });

  it('should set, get and delete credentials', async () => {
    await setCredential('test_key', 'test_val');
    let val = await getCredential('test_key');
    expect(val).toBe('test_val');

    await deleteCredential('test_key');
    val = await getCredential('test_key');
    expect(val).toBeNull();
  });
});
