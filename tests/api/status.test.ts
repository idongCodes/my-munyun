import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/status/route';

describe('Status API Route (api/status)', () => {
  it('should return system connection status', async () => {
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('is_plaid_configured');
    expect(data).toHaveProperty('use_mock_data');
    expect(data).toHaveProperty('boa_linked');
    expect(data).toHaveProperty('cashapp_linked');
  });
});
