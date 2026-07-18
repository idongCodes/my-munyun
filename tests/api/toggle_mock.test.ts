import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/toggle_mock/route';

describe('Toggle Mock Mode API Route (api/toggle_mock)', () => {
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
