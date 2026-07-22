import { NextResponse } from 'next/server';
import { 
  getCredential, 
  setCredential, 
  wipeDatabase, 
  createUser, 
  getUserById,
  getUserByEmail, 
  getUserByPhone, 
  updateUser 
} from '@/lib/db';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { cleanPhoneNumber, sendTwilioSms } from '@/lib/twilio';
import { 
  setSessionCookie, 
  clearSessionCookie, 
  getSessionUserId,
  encryptSession,
  decryptSession,
  setTempSmsCookie,
  getTempSmsCookie,
  clearTempSmsCookie
} from '@/lib/session';

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

    // Keep legacy passcode support for test compatibilities
    if (action === "passcode") {
      const { passcode } = body;
      if (passcode === APP_PASSWORD) {
        // Find or create default user for passcode tests so they get a valid session
        let defaultUser = await getUserByEmail("admin@example.com");
        if (!defaultUser) {
          defaultUser = {
            id: "00000000-0000-0000-0000-000000000000",
            email: "admin@example.com",
            first_name: "Admin",
            last_name: "User",
            preferred_name: "Admin",
            mobile_number: "",
            password: APP_PASSWORD
          };
          await createUser(defaultUser);
        }
        await setSessionCookie(defaultUser.id);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ success: false, message: "Incorrect passcode. Please try again." });
    }

    if (action === "logout") {
      await clearSessionCookie();
      return NextResponse.json({ success: true });
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
      const { code, email } = body;
      const cleanCode = (code || "").replace(/\s/g, "");
      if (!email) {
        return NextResponse.json({ success: false, message: "Email is required." });
      }
      
      const user = await getUserByEmail(email);
      if (!user) {
        return NextResponse.json({ success: false, message: "Invalid email or Authenticator code." });
      }

      // If user has a specific totp_secret, use it. Otherwise, fallback to global TOTP_SECRET for backwards compatibility
      const secretToUse = user.totp_secret || TOTP_SECRET;
      if (!secretToUse) {
        return NextResponse.json({ success: false, message: "Authenticator 2FA is not set up for this user." });
      }

      const isValid = verifySync({ token: cleanCode, secret: secretToUse });
      if (isValid) {
        await setSessionCookie(user.id);
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
      const allowAll = process.env.ALLOWED_PHONE_NUMBERS === '*';
      if (!allowAll && !ALLOWED_PHONE_NUMBERS.includes(cleanedNum)) {
        return NextResponse.json({ success: false, message: `Phone number ${cleanedNum} not authorized.` });
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      
      // Store verification state in a secure, stateless, encrypted cookie
      const expiry = Date.now() + 5 * 60 * 1000; // 5 min expiry
      const encrypted = encryptSession(`${cleanedNum}:${code}:${expiry}`);
      
      await setTempSmsCookie(encrypted);

      const sent = await sendTwilioSms(cleanedNum, code);
      if (sent) {
        return NextResponse.json({ success: true, demoMode: false });
      } else {
        return NextResponse.json({ success: true, demoMode: true, code });
      }
    }

    if (action === "sms_verify") {
      const { code, phone } = body;
      if (!phone) {
        return NextResponse.json({ success: false, message: "Phone number is required." });
      }
      const cleanCode = (code || "").replace(/\s/g, "");
      const cleanedNum = cleanPhoneNumber(phone);

      const cookieVal = await getTempSmsCookie();
      if (!cookieVal) {
        return NextResponse.json({ success: false, message: "No SMS code requested or session expired." });
      }

      const decrypted = decryptSession(cookieVal);
      if (!decrypted) {
        return NextResponse.json({ success: false, message: "Verification session expired. Please request a new one." });
      }

      const [storedPhone, storedCode, storedExpiry] = decrypted.split(':');
      if (storedPhone !== cleanedNum) {
        return NextResponse.json({ success: false, message: "Phone number mismatch. Please request a new code." });
      }

      if (Date.now() > Number(storedExpiry)) {
        return NextResponse.json({ success: false, message: "Verification code expired. Please request a new one." });
      }

      if (cleanCode === storedCode) {
        // Successful verification! Clear the temp cookie
        await clearTempSmsCookie();

        const user = await getUserByPhone(cleanedNum);
        if (user) {
          // It's a login, set session cookie!
          await setSessionCookie(user.id);
        }
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ success: false, message: "Invalid verification code. Please try again." });
    }

    if (action === "check_duplicate") {
      const { email, mobileNumber } = body;
      if (email) {
        const u = await getUserByEmail(email);
        if (u) {
          return NextResponse.json({ exists: true, field: "email", message: "An account with this email already exists." });
        }
      }
      if (mobileNumber) {
        const u = await getUserByPhone(mobileNumber);
        if (u) {
          return NextResponse.json({ exists: true, field: "mobileNumber", message: "An account with this phone number already exists." });
        }
      }
      return NextResponse.json({ exists: false });
    }

    if (action === "register_user") {
      const { firstName, lastName, preferredName, email, mobileNumber, isGoogle, primaryGoal, password, totpSecret } = body;
      if (!isGoogle && (!firstName || !lastName || !email || !mobileNumber)) {
        return NextResponse.json({ success: false, message: "Please fill out all required fields." });
      }

      const cleanEmail = email.trim().toLowerCase();
      const existingUser = await getUserByEmail(cleanEmail);
      if (existingUser) {
        return NextResponse.json({ success: false, message: "An account with this email already exists." });
      }

      const cleanPhone = cleanPhoneNumber(mobileNumber);
      const newUser = {
        id: crypto.randomUUID(),
        email: cleanEmail,
        first_name: firstName || "Google User",
        last_name: lastName || "",
        preferred_name: preferredName || firstName || "User",
        mobile_number: cleanPhone,
        password: password || "",
        totp_secret: totpSecret || null,
        totp_enabled: !!totpSecret,
        google_id: isGoogle ? "google_placeholder_id" : null,
        avatar_url: null
      };

      await createUser(newUser);
      await setSessionCookie(newUser.id);
      return NextResponse.json({ success: true, message: "Registration successful!" });
    }

    if (action === "update_settings") {
      const userId = await getSessionUserId();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { firstName, lastName, preferredName, email, mobileNumber, password } = body;
      const user = await getUserById(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const currentFirstName = user.first_name || "";
      const currentLastName = user.last_name || "";

      // Check if first or last name is changing
      const nameChanged = (firstName !== undefined && firstName.trim() !== currentFirstName.trim()) || 
                          (lastName !== undefined && lastName.trim() !== currentLastName.trim());

      if (nameChanged) {
        const nameLastUpdatedAt = await getCredential(userId, "user_name_last_updated_at");
        if (nameLastUpdatedAt) {
          const timeDiff = Date.now() - new Date(nameLastUpdatedAt).getTime();
          const seventyTwoHours = 72 * 60 * 60 * 1000;
          if (timeDiff < seventyTwoHours) {
            const hoursLeft = Math.ceil((seventyTwoHours - timeDiff) / (60 * 60 * 1000));
            return NextResponse.json({ 
              success: false, 
              message: `First or Last name can only be changed once every 72 hours. Please try again in ${hoursLeft} hours.` 
            });
          }
        }
      }

      // Apply modifications
      const userUpdates: any = {};
      if (firstName !== undefined) userUpdates.first_name = firstName.trim();
      if (lastName !== undefined) userUpdates.last_name = lastName.trim();
      if (preferredName !== undefined) userUpdates.preferred_name = preferredName.trim();
      if (email !== undefined) userUpdates.email = email.trim().toLowerCase();
      if (mobileNumber !== undefined) userUpdates.mobile_number = cleanPhoneNumber(mobileNumber);
      if (password !== undefined && password.trim() !== "") userUpdates.password = password;

      if (Object.keys(userUpdates).length > 0) {
        await updateUser(userId, userUpdates);
      }

      if (nameChanged) {
        await setCredential(userId, "user_name_last_updated_at", new Date().toISOString());
      }

      return NextResponse.json({ success: true, message: "Settings saved successfully!" });
    }

    if (action === "delete_account") {
      const userId = await getSessionUserId();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      await wipeDatabase(userId);
      await clearSessionCookie();
      return NextResponse.json({ success: true, message: "Account successfully wiped." });
    }

    if (action === "password_login") {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json({ success: false, message: "Email and password are required." });
      }

      const user = await getUserByEmail(email);
      if (!user || !user.password || user.password !== password) {
        return NextResponse.json({ success: false, message: "Invalid email or password." });
      }

      await setSessionCookie(user.id);
      return NextResponse.json({ success: true });
    }

    if (action === "unlink_google") {
      const userId = await getSessionUserId();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { email, password } = body;
      const cleanEmail = (email || "").trim().toLowerCase();

      if (!cleanEmail) {
        return NextResponse.json({ success: false, message: "Email address is required to unlink Google." });
      }
      if (!password || password.trim().length < 4) {
        return NextResponse.json({ success: false, message: "Please enter a valid password (at least 4 characters)." });
      }

      // Check duplicate email
      const duplicateUser = await getUserByEmail(cleanEmail);
      if (duplicateUser && duplicateUser.id !== userId) {
        return NextResponse.json({ success: false, message: "This email address is already linked to another Munyun profile." });
      }

      // Update user credentials and remove google link
      await updateUser(userId, {
        email: cleanEmail,
        password: password,
        google_id: null
      });

      return NextResponse.json({ success: true, message: "Google account successfully unlinked." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Auth API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
