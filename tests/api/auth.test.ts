import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/route';
import { initDb } from '@/lib/db';

describe('Auth API Route (api/auth)', () => {
  beforeEach(async () => {
    await initDb();
  });

  it('should authenticate with correct passcode', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'passcode', passcode: 'admin' })
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should reject incorrect passcode', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'passcode', passcode: 'wrong_passcode' })
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Incorrect passcode. Please try again.');
  });

  it('should generate secret and QR URI on totp_setup', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'totp_setup' })
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.secret).toBeDefined();
    expect(data.qrProvisioningUri).toContain('otpauth://totp/');
  });

  it('should handle TOTP verification with invalid code', async () => {
    const setupReq = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'totp_setup' })
    });
    const setupRes = await POST(setupReq);
    const setupData = await setupRes.json();

    const verifyReq = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'totp_verify', secret: setupData.secret, code: '000000' })
    });

    const verifyRes = await POST(verifyReq);
    const verifyData = await verifyRes.json();
    expect(verifyRes.status).toBe(200);
    expect(verifyData.success).toBe(false);
    expect(verifyData.message).toContain('Invalid verification code');
  });

  it('should handle SMS code generation and verification', async () => {
    const sendReq = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sms_send', phone: '+17743126471' })
    });

    const sendRes = await POST(sendReq);
    const sendData = await sendRes.json();
    expect(sendData.success).toBe(true);

    const code = sendData.code;
    expect(code).toBeDefined();

    const verifyReq = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sms_verify', code })
    });

    const verifyRes = await POST(verifyReq);
    const verifyData = await verifyRes.json();
    expect(verifyData.success).toBe(true);
  });

  it('should return error for invalid action', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invalid_action' })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
