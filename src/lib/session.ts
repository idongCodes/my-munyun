import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.APP_PASSWORD || 'default_session_secret_change_me_123456';
const COOKIE_NAME = 'munyun_session';

// Encrypt user session payload using AES-256-GCM
export function encryptSession(userId: string): string {
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(SESSION_SECRET, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const payload = JSON.stringify({ 
    userId, 
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days expiry
  });
  
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

// Decrypt user session payload using AES-256-GCM
export function decryptSession(token: string): string | null {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) return null;
    
    const [ivHex, encryptedHex, authTagHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const key = crypto.scryptSync(SESSION_SECRET, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted as any, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    const parsed = JSON.parse(decrypted);
    if (parsed.expiresAt < Date.now()) {
      return null; // Expired
    }
    return parsed.userId;
  } catch (error) {
    console.error('Failed to decrypt session:', error);
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  const token = encryptSession(userId);
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie || !cookie.value) return null;
    return decryptSession(cookie.value);
  } catch (e) {
    return null;
  }
}

export async function setTempSmsCookie(value: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('temp_sms_verify', value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5 * 60, // 5 minutes
    path: '/'
  });
}

export async function getTempSmsCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('temp_sms_verify');
    return cookie ? cookie.value : null;
  } catch (e) {
    return null;
  }
}

export async function clearTempSmsCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('temp_sms_verify');
}
