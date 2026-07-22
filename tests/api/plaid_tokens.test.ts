import { describe, it, expect, beforeEach } from 'vitest';
import { POST as createLinkTokenPOST } from '@/app/api/create_link_token/route';
import { POST as exchangeTokenPOST } from '@/app/api/exchange_public_token/route';
import { initDb, getAccounts } from '@/lib/db';

describe('Plaid Link & Exchange API Routes', () => {
  beforeEach(async () => {
    await initDb();
  });

  it('should return mock link token in mock mode', async () => {
    const req = new Request('http://localhost/api/create_link_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institution: 'Bank of America' })
    });

    const res = await createLinkTokenPOST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.link_token).toBe('mock_link_token');
  });

  it('should exchange public token and seed mock accounts in mock mode', async () => {
    const req = new Request('http://localhost/api/exchange_public_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_token: 'mock_public_token', institution: 'boa' })
    });

    const res = await exchangeTokenPOST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('success');

    const accounts = await getAccounts();
    expect(accounts.length).toBeGreaterThan(0);
  });
});
