import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/transactions/route';
import { initDb, saveTransactions, getTransactions } from '@/lib/db';

describe('Transactions API Route (api/transactions)', () => {
  beforeEach(async () => {
    await initDb();
  });

  it('should return transactions and accounts on GET', async () => {
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('transactions');
    expect(data).toHaveProperty('accounts');
    expect(Array.isArray(data.transactions)).toBe(true);
    expect(Array.isArray(data.accounts)).toBe(true);
  });

  it('should update transaction category and notes on POST', async () => {
    await saveTransactions([
      { id: 'tx_test_api', account_id: 'acc_1', amount: 12.50, date: '2026-07-05', name: 'Starbucks', category: 'Dining', pending: false, institution: 'Bank of America', notes: 'Coffee' }
    ]);

    const updateReq = new Request('http://localhost/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'tx_test_api', category: 'Coffee & Snacks', notes: 'Morning brew' })
    });

    const res = await POST(updateReq);
    const data = await res.json();
    expect(data.status).toBe('success');

    const transactions = await getTransactions();
    const updated = transactions.find((t: any) => t.id === 'tx_test_api');
    expect(updated).toBeDefined();
    expect(updated.category).toBe('Coffee & Snacks');
    expect(updated.notes).toBe('Morning brew');
  });

  it('should return 400 when missing required fields on POST', async () => {
    const badReq = new Request('http://localhost/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'tx_test_api' }) // Missing category
    });

    const res = await POST(badReq);
    expect(res.status).toBe(400);
  });
});
