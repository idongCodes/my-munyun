import { describe, it, expect, beforeEach } from 'vitest';
import { generateMockData } from '@/lib/mock';
import { initDb, getAccounts, getTransactions } from '@/lib/db';

describe('Mock Data Module (mock.ts)', () => {
  beforeEach(async () => {
    await initDb();
  });

  it('should generate mock accounts and transactions successfully', async () => {
    await generateMockData('boa');
    const accounts = await getAccounts();
    const transactions = await getTransactions();

    expect(accounts.length).toBeGreaterThan(0);
    expect(transactions.length).toBeGreaterThan(0);

    const checkAcc = accounts.find(a => a.institution === 'Bank of America');
    expect(checkAcc).toBeDefined();

    const checkTx = transactions.find(t => t.category === 'Income');
    expect(checkTx).toBeDefined();
  });
});
