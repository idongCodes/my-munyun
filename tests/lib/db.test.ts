import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getDb, 
  getAccounts, 
  getTransactions, 
  saveBudget, 
  getBudgets, 
  updateTransaction, 
  clearAllData, 
  getPlaidItems, 
  savePlaidItem 
} from '@/lib/db';

describe('Database Module (db.ts)', () => {
  beforeEach(async () => {
    await clearAllData();
    const db = await getDb();
    // Reseed initial data for testing
    await db.exec(`
      INSERT OR REPLACE INTO accounts (id, name, type, subtype, mask, institution, balance_current, balance_available)
      VALUES ('acc_test_1', 'Advantage Checking', 'depository', 'checking', '1234', 'Bank of America', 5420.50, 5420.50);

      INSERT OR REPLACE INTO transactions (id, account_id, amount, date, name, category, pending, institution, notes)
      VALUES ('tx_test_1', 'acc_test_1', 45.99, '2026-07-01', 'Whole Foods Market', 'Groceries', 0, 'Bank of America', 'Weekly grocery shopping');
    `);
  });

  it('should initialize database connection and tables', async () => {
    const db = await getDb();
    expect(db).toBeDefined();
  });

  it('should fetch accounts successfully', async () => {
    const accounts = await getAccounts();
    expect(Array.isArray(accounts)).toBe(true);
    expect(accounts.length).toBeGreaterThan(0);
    expect(accounts[0].name).toBe('Advantage Checking');
    expect(accounts[0].institution).toBe('Bank of America');
  });

  it('should fetch transactions successfully', async () => {
    const transactions = await getTransactions();
    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions[0].name).toBe('Whole Foods Market');
    expect(transactions[0].category).toBe('Groceries');
  });

  it('should update a transaction category and notes', async () => {
    await updateTransaction('tx_test_1', 'Dining', 'Lunch meeting');
    const transactions = await getTransactions();
    const updatedTx = transactions.find(t => t.id === 'tx_test_1');
    expect(updatedTx).toBeDefined();
    expect(updatedTx.category).toBe('Dining');
    expect(updatedTx.notes).toBe('Lunch meeting');
  });

  it('should save and retrieve custom budgets', async () => {
    await saveBudget('Dining', 350);
    const budgets = await getBudgets();
    expect(budgets['Dining']).toBe(350);
  });

  it('should save and retrieve Plaid items', async () => {
    await savePlaidItem('item_test_100', 'access_token_100', 'Bank of America');
    const items = await getPlaidItems();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].item_id).toBe('item_test_100');
    expect(items[0].institution_name).toBe('Bank of America');
  });

  it('should clear all data', async () => {
    await clearAllData();
    const accounts = await getAccounts();
    const transactions = await getTransactions();
    const items = await getPlaidItems();
    expect(accounts.length).toBe(0);
    expect(transactions.length).toBe(0);
    expect(items.length).toBe(0);
  });
});
