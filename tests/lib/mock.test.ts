import { describe, it, expect } from 'vitest';
import { MOCK_ACCOUNTS, MOCK_TRANSACTIONS, getMockStatus } from '@/lib/mock';

describe('Mock Data Module (mock.ts)', () => {
  it('should export mock accounts with valid structures', () => {
    expect(Array.isArray(MOCK_ACCOUNTS)).toBe(true);
    expect(MOCK_ACCOUNTS.length).toBeGreaterThan(0);
    const firstAcc = MOCK_ACCOUNTS[0];
    expect(firstAcc).toHaveProperty('id');
    expect(firstAcc).toHaveProperty('name');
    expect(firstAcc).toHaveProperty('institution');
    expect(firstAcc).toHaveProperty('balance_current');
  });

  it('should export mock transactions with positive/negative amounts', () => {
    expect(Array.isArray(MOCK_TRANSACTIONS)).toBe(true);
    expect(MOCK_TRANSACTIONS.length).toBeGreaterThan(0);
    const firstTx = MOCK_TRANSACTIONS[0];
    expect(firstTx).toHaveProperty('id');
    expect(firstTx).toHaveProperty('amount');
    expect(firstTx).toHaveProperty('category');
    expect(firstTx).toHaveProperty('institution');
  });

  it('should return mock system status', () => {
    const status = getMockStatus();
    expect(status).toHaveProperty('mockMode');
    expect(status).toHaveProperty('plaidConfigured');
    expect(status).toHaveProperty('twilioConfigured');
    expect(status).toHaveProperty('connectedAccountsCount');
    expect(status.mockMode).toBe(true);
  });
});
