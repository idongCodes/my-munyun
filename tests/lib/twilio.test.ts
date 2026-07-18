import { describe, it, expect } from 'vitest';
import { cleanPhoneNumber, sendTwilioSms } from '@/lib/twilio';

describe('Twilio SMS Module (twilio.ts)', () => {
  it('should clean 10-digit phone numbers into E.164 format', () => {
    expect(cleanPhoneNumber('7743126471')).toBe('+17743126471');
    expect(cleanPhoneNumber('(774) 312-6471')).toBe('+17743126471');
    expect(cleanPhoneNumber('17743126471')).toBe('+17743126471');
    expect(cleanPhoneNumber('+17743126471')).toBe('+17743126471');
  });

  it('should return false when Twilio credentials are not set', async () => {
    const result = await sendTwilioSms('+17743126471', '123456');
    expect(result).toBe(false);
  });
});
