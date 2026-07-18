import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/toggle_mock/route';
import { initDb } from '@/lib/db';

describe('Toggle Mock Mode API Route (api/toggle_mock)', () => {
  beforeEach(async () => {
    await initDb();
  });

  it('should handle mock toggle requests safely', async () => {
    const req = new Request('http://localhost/api/toggle_mock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ use_mock: true })
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.use_mock_data).toBe(true);
  });
});
