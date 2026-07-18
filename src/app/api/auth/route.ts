import { NextResponse } from 'next/server';
import { getCredential, setCredential } from '@/lib/db';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { cleanPhoneNumber, sendTwilioSms } from '@/lib/twilio';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    const APP_PASSWORD = process.env.APP_PASSWORD || "admin";
    const TOTP_SECRET = process.env.TOTP_SECRET || "";
    const ALLOWED_PHONE_NUMBERS = (process.env.ALLOWED_PHONE_NUMBERS || "+17743126471")
      .split(",")
      .map(n => cleanPhoneNumber(n.trim()))
      .filter(Boolean);

    if (action === "passcode") {
      const { passcode } = body;
      if (passcode === APP_PASSWORD) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ success: false, message: "Incorrect passcode. Please try again." });
    }

    if (action === "totp_setup") {
      const secret = generateSecret();
      const qrProvisioningUri = generateURI({
        secret,
        label: "idongcodes",
        issuer: "Munyun"
      });
      return NextResponse.json({ success: true, secret, qrProvisioningUri });
    }

    if (action === "totp_verify") {
      const { code, secret } = body;
      const cleanCode = (code || "").replace(/\s/g, "");
      const isValid = verifySync({ token: cleanCode, secret });
      if (isValid) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ success: false, message: "Invalid verification code. Please try again." });
    }

    if (action === "totp_login") {
      const { code } = body;
      const cleanCode = (code || "").replace(/\s/g, "");
      if (!TOTP_SECRET) {
        return NextResponse.json({ success: false, message: "TOTP is not configured. Use passcode login." });
      }
      const isValid = verifySync({ token: cleanCode, secret: TOTP_SECRET });
      if (isValid) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ success: false, message: "Invalid Authenticator code. Please check your app." });
    }

    if (action === "sms_send") {
      const { phone } = body;
      if (!phone) {
        return NextResponse.json({ success: false, message: "Please enter your phone number." });
      }

      const cleanedNum = cleanPhoneNumber(phone);
      if (!ALLOWED_PHONE_NUMBERS.includes(cleanedNum)) {
        return NextResponse.json({ success: false, message: `Phone number ${cleanedNum} not authorized.` });
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      await setCredential("sms_code", code);
      await setCredential("sms_phone", cleanedNum);
      await setCredential("sms_expiry", String(Date.now() + 5 * 60 * 1000)); // 5 min expiry

      const sent = await sendTwilioSms(cleanedNum, code);
      if (sent) {
        return NextResponse.json({ success: true, demoMode: false });
      } else {
        return NextResponse.json({ success: true, demoMode: true, code });
      }
    }

    if (action === "sms_verify") {
      const { code } = body;
      const cleanCode = (code || "").replace(/\s/g, "");

      const storedCode = await getCredential("sms_code");
      const storedExpiry = await getCredential("sms_expiry");

      if (!storedCode || !storedExpiry) {
        return NextResponse.json({ success: false, message: "No SMS code requested." });
      }

      if (Date.now() > Number(storedExpiry)) {
        return NextResponse.json({ success: false, message: "Verification code expired. Please request a new one." });
      }

      if (cleanCode === storedCode) {
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ success: false, message: "Invalid verification code. Please try again." });
    }

    if (action === "register_user") {
      const { firstName, lastName, preferredName, email, mobileNumber, isGoogle } = body;
      if (!isGoogle && (!firstName || !lastName || !email || !mobileNumber)) {
        return NextResponse.json({ success: false, message: "Please fill out all required fields." });
      }
      await setCredential("user_firstName", firstName || "");
      await setCredential("user_lastName", lastName || "");
      await setCredential("user_preferredName", preferredName || firstName || "User");
      await setCredential("user_email", email || "");
      await setCredential("user_mobileNumber", mobileNumber || "");
      await setCredential("user_registered", "true");
      return NextResponse.json({ success: true, message: "Registration successful!" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Auth API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
