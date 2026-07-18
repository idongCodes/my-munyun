import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/auth/route';
import { generateSecret, generateToken } from 'otplib';

describe('Auth API Route (api/auth)', () => {
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

  it('should verify generated TOTP secret code', async () => {
    const secret = generateSecret();
    const token = generateToken({ secret });

    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'totp_verify', secret, code: token })
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(true);
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
