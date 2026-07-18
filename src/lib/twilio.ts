export function cleanPhoneNumber(phoneStr: string): string {
  const digits = phoneStr.replace(/\D/g, '');
  if (digits.length === 10) {
    return "+1" + digits;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    return "+" + digits;
  }
  return "+" + digits;
}

export async function sendTwilioSms(toNumber: string, code: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

  if (!accountSid || !authToken || !fromNumber) {
    return false;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const body = new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: `Your Munyun Verification Code is: ${code}`,
    });

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    return res.status === 201;
  } catch (error) {
    console.error('Error sending Twilio SMS:', error);
    return false;
  }
}
