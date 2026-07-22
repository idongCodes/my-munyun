import { describe, it, expect, beforeEach } from 'vitest';
import { POST as syncPOST } from '@/app/api/sync/route';
import { POST as clearPOST } from '@/app/api/clear/route';
import { initDb, getAccounts, getTransactions, setCredential } from '@/lib/db';

describe('Sync and Clear API Routes', () => {
  beforeEach(async () => {
    await initDb();
    await setCredential('access_token_boa', 'mock_access_token_boa');
  });

  it('should trigger data sync and update records', async () => {
    const res = await syncPOST();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('success');

    const accounts = await getAccounts();
    expect(accounts.length).toBeGreaterThan(0);
  });

  it('should clear all transaction and account data on POST', async () => {
    const res = await clearPOST();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('success');

    const accounts = await getAccounts();
    const transactions = await getTransactions();
    expect(accounts.length).toBe(0);
    expect(transactions.length).toBe(0);
  });
});
