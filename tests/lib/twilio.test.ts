import { describe, it, expect } from 'vitest';
import { sendSmsCode, verifySmsCode, isTwilioConfigured } from '@/lib/twilio';

describe('Twilio SMS Module (twilio.ts)', () => {
  it('should indicate whether Twilio environment variables are configured', () => {
    const configured = isTwilioConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('should return demo SMS verification code when Twilio is unconfigured', async () => {
    const result = await sendSmsCode('+15551234567');
    expect(result.success).toBe(true);
    expect(result.demoMode).toBe(true);
    expect(result.code).toBeDefined();
    expect(result.code).toMatch(/^\d{6}$/);
  });

  it('should verify the correct SMS code', async () => {
    const sendResult = await sendSmsCode('+15559876543');
    const validCode = sendResult.code!;

    const invalidVerify = await verifySmsCode('000000');
    expect(invalidVerify.success).toBe(false);

    const validVerify = await verifySmsCode(validCode);
    expect(validVerify.success).toBe(true);
  });
});
