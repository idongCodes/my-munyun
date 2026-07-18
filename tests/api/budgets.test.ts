import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/budgets/route';
import { initDb } from '@/lib/db';

describe('Budgets API Route (api/budgets)', () => {
  beforeEach(async () => {
    await initDb();
  });

  it('should save and return custom budget limits', async () => {
    const postReq = new Request('http://localhost/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'Entertainment', limit_amount: 300 })
    });

    const postRes = await POST(postReq);
    const postData = await postRes.json();
    expect(postData.status).toBe('success');

    const getRes = await GET();
    const getData = await getRes.json();
    expect(getData['Entertainment']).toBe(300);
  });

  it('should delete a custom budget category', async () => {
    const deleteReq = new Request('http://localhost/api/budgets?category=Entertainment', {
      method: 'DELETE'
    });

    const deleteRes = await DELETE(deleteReq);
    const deleteData = await deleteRes.json();
    expect(deleteData.status).toBe('success');

    const getRes = await GET();
    const getData = await getRes.json();
    expect(getData['Entertainment']).toBeUndefined();
  });
});
